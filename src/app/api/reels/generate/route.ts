import { NextResponse } from 'next/server';
import { generateSportsScript } from '@/lib/ai/generateScript';
import { textToSpeech } from '@/lib/ai/textToSpeech';
import { generateVideo } from '@/lib/ai/videoGen';
import { uploadToS3 } from '@/lib/aws/s3';
import { DynamoDBClient, PutItemCommand } from '@aws-sdk/client-dynamodb';

export async function POST(request: Request) {
  try {
    const { celebrity } = await request.json();

    console.log("celebrity", celebrity)
    
    // Step 1: Generate script
    const script = await generateSportsScript(celebrity);
    
    // Step 2: Generate audio
    const audioUrl = await textToSpeech(script);
    
    // Step 3: Generate video
    const videoBuffer = await generateVideo(celebrity, script, audioUrl);
    
    // Step 4: Upload to S3
    const timestamp = new Date().getTime();
    const s3Key = `reels/${celebrity.toLowerCase().replace(/\s+/g, '-')}-${timestamp}.mp4`;
    const s3Url = await uploadToS3(videoBuffer, s3Key);
    
    // Step 5: Store metadata in DynamoDB
    const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });
    const command = new PutItemCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Item: {
        id: { S: s3Key },
        celebrity: { S: celebrity },
        script: { S: script },
        url: { S: s3Url },
        createdAt: { S: new Date().toISOString() },
        status: { S: 'COMPLETED' },
      },
    });
    
    await dynamodb.send(command);
    
    return NextResponse.json({
      success: true,
      url: s3Url,
    });
    
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: 'Failed to generate reel' },
      { status: 500 }
    );
  }
}