import Image from 'next/image';
import { FC } from 'react';

export const ArcadeControls: FC = () => {
  return (
    <div className="absolute bottom-56 left-0 right-0 ">
      <div className="relative flex h-28 w-full flex-row justify-center">
        <Image priority fill src="/ArcadeControls.svg" alt="" />
      </div>
    </div>
  );
};
