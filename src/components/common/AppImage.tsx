import NextImage, { ImageProps } from 'next/image';

const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? '';

export const AppImage: React.FC<ImageProps> = ({ src, ...props }) => {
  const resolvedSrc =
    typeof src === 'string' && basePath && src.startsWith('/') && !src.startsWith(`${basePath}/`)
      ? `${basePath}${src}`
      : src;

  return <NextImage src={resolvedSrc} {...props} />;
};
