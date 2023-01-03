import Image from 'next/image';
import { FC } from 'react';

export const CreatedByModulousLabs: FC = () => {
  return (
    <div className="absolute bottom-[17.75rem] right-60">
      <div className="relative h-10 w-60">
        <Image priority fill src="/CreatedByModulousLabs.svg" alt="" />
      </div>
    </div>
  );
};
