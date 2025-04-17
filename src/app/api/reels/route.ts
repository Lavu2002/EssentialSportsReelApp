// src/app/api/reels/route.ts
import { NextResponse } from 'next/server';
import { DynamoDBClient, ScanCommand } from '@aws-sdk/client-dynamodb';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

const dynamodb = new DynamoDBClient({ region: process.env.AWS_REGION });

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const limit = parseInt(searchParams.get('limit') || '10');
  const cursor = searchParams.get('cursor');

  try {
    const command = new ScanCommand({
      TableName: process.env.DYNAMODB_TABLE,
      Limit: limit,
      ExclusiveStartKey: cursor ? JSON.parse(cursor) : undefined,
    });

    console.log("command",command)
    const result = await dynamodb.send(command);
    
    if (!result.Items) {
      return NextResponse.json({ data: [] });
    }

    const reels = result.Items.map(item => unmarshall(item));

    return NextResponse.json({
      data: reels,
      nextCursor: result.LastEvaluatedKey 
        ? encodeURIComponent(JSON.stringify(result.LastEvaluatedKey)) 
        : null,
    });
  } catch (error) {
    console.error('DynamoDB error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reels', details: error.message },
      { status: 500 }
    );
  }
}