import type { SVGProps } from 'react';
import Image from 'next/image';

export function NammaDrishtiLogo(props: Omit<React.ComponentProps<typeof Image>, 'src' | 'alt'>) {
  return (
    <Image
      src="https://storage.googleapis.com/project-spark-341215.appspot.com/c6e1c590-5091-4969-a1d2-310501a43874"
      alt="NammaDrishti Ai Logo"
      width={40}
      height={40}
      {...props}
    />
  );
}
