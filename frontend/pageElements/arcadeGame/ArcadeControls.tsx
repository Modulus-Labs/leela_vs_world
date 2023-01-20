import Image from 'next/image';
import { FC } from 'react';

export const ArcadeControls: FC = () => {
  return (
    <div className="flex h-full w-full flex-row items-center justify-center">
      <div className="relative flex h-full w-full">
        <Image priority fill src="/ArcadeControls.svg" alt="" />
      </div>
    </div>
  );
};
