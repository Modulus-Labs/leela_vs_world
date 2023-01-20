// import { motion, Variants } from 'framer-motion';
import Image from 'next/image';
import { FC } from 'react';
import { SquaresOverlay } from './SquaresOverlay';

// const ButtonVariants: Variants = {
//   initial: {
//     filter: 'brightness(100%)',
//     scale: 1,
//   },
//   tap: {
//     filter: 'brightness(85%)',
//     scale: 0.975,
//   },
// };

// type MoveButtonProps = {
//   disabled: boolean;
//   buttonImageUrl: string;
//   onClick: MouseEventHandler<HTMLButtonElement>;
// };

// const MoveButton: FC<MoveButtonProps> = ({
//   buttonImageUrl,
//   onClick,
//   disabled,
// }) => {
//   return (
//     <motion.button
//       variants={ButtonVariants}
//       initial="initial"
//       whileTap="tap"
//       disabled={disabled}
//       className="relative h-7 w-28 disabled:opacity-50"
//       onClick={onClick}
//     >
//       <Image priority fill src={buttonImageUrl} alt="Left" />
//     </motion.button>
//   );
// };

export const ChessBoard: FC = () => {
  return (
    <div className="relative h-full w-full">
      <Image
        quality="100"
        src="/ChessBoard.svg"
        alt=""
        style={{
          imageRendering: 'pixelated',
          objectFit: 'contain',
          objectPosition: 'center',
        }}
        fill
        priority
      />
      <SquaresOverlay />
    </div>
  );
};
