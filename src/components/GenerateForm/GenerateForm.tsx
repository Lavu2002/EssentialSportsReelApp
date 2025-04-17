// src/components/GenerateForm/GenerateForm.tsx
'use client';

import { useState } from 'react';
import styles from './GenerateForm.module.css';

export default function GenerateForm() {
  const [celebrity, setCelebrity] = useState('');
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!celebrity.trim()) {
      setError('Please enter a celebrity name');
      return;
    }

    setIsGenerating(true);
    setError('');
    setSuccess('');

    try {
      const response = await fetch('/api/reels/generate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ celebrity }),
      });

      if (!response.ok) {
        throw new Error('Failed to generate reel');
      }

      const data = await response.json();
      setSuccess(`Reel for ${celebrity} is being generated! Check back soon.`);
      setCelebrity('');
    } catch (err) {
      setError(err.message || 'Something went wrong');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className={styles.form}>
      <h2>Generate New Reel</h2>
      <div className={styles.inputGroup}>
        <label htmlFor="celebrity">Sports Celebrity Name:</label>
        <input
          type="text"
          id="celebrity"
          value={celebrity}
          onChange={(e) => setCelebrity(e.target.value)}
          placeholder="e.g. Michael Jordan, Serena Williams"
        />
      </div>
      <button 
        type="submit" 
        disabled={isGenerating}
        className={styles.submitButton}
      >
        {isGenerating ? 'Generating...' : 'Generate Reel'}
      </button>
      {error && <p className={styles.error}>{error}</p>}
      {success && <p className={styles.success}>{success}</p>}
    </form>
  );
}