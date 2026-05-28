import React from 'react';
import { getFlagUrl } from '../services/flags';

export default function FlagImage({ name, height = 16 }) {
  const url = getFlagUrl(name);
  if (!url) return null;
  return (
    <img
      src={url}
      alt={name}
      height={height}
      style={{ display: 'inline-block', verticalAlign: 'middle', borderRadius: 2, marginRight: 6 }}
    />
  );
}
