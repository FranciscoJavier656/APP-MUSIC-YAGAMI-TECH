import React from 'react';
import { useLocalImage } from '../lib/useLocalImage';

export function OfflineImage({ localPath, remoteUrl, className, alt }: { localPath?: string, remoteUrl?: string, className?: string, alt?: string }) {
  const src = useLocalImage(localPath, remoteUrl);
  return <img src={src} alt={alt} className={className} />;
}
