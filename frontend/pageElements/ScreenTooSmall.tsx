import { FC } from 'react';

export const ScreenTooSmall: FC = () => {
  return (
    <div className="flex h-screen w-full flex-row items-center justify-center bg-off-black">
      <p className="text-4xl font-bold text-off-white">
        ⚠️ Please View on a Larger Screen 🤖
      </p>
    </div>
  );
};
