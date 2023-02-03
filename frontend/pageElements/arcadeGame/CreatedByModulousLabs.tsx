import Image from 'next/image';
import { FC } from 'react';

export const CreatedByModulousLabs: FC = () => {
  return (
    <div className="flex h-full w-full flex-row items-center justify-end">
      <div className="relative flex h-full w-[450px]">
        <Image priority fill src="/CreatedByModulousLabs.svg" alt="" />
      </div>
    </div>
  );
};
