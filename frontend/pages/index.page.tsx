import Image from 'next/image';
import { ArcadeHeader } from '../pageElements/arcadeGame/ArcadeHeader';
import { NextMoveLeaderboard } from '../pageElements/arcadeGame/NextMoveLeaderboard';
import { NextMoveTimer } from '../pageElements/arcadeGame/NextMoveTimer';
import { PrizePool } from '../pageElements/arcadeGame/PrizePool';
import { ChessBoard } from '../pageElements/arcadeGame/ChessBoard/ChessBoard';
import { VotingPanel } from '../pageElements/arcadeGame/votingPanel/VotingPanel';
import { useArcadeMachineContext } from '../contexts/ArcadeMachineContext';
import { GameDetails } from '../pageElements/gamePopups/GameDetails';
import { GameInstructions } from '../pageElements/gamePopups/GameInstructions';
import { ArcadeControls } from '../pageElements/arcadeGame/ArcadeControls';
import { CreatedByModulousLabs } from '../pageElements/arcadeGame/CreatedByModulousLabs';
import { useMediaQueryContext } from '../contexts/MediaQueryContext';
import { ScreenTooSmall } from '../pageElements/ScreenTooSmall';

export default function Home() {
  const { isMobile } = useMediaQueryContext();
  const { showGameInstructions, showGameDetails } = useArcadeMachineContext();

  if (isMobile) {
    return <ScreenTooSmall />;
  }

  return (
    <div className="flex h-screen flex-row items-end justify-center bg-off-black">
      <svg
        className="max-h-[95%] w-full max-w-[1050px] object-contain"
        viewBox="0 0 2048 1676"
      >
        <foreignObject width="2048" height="1676" alignmentBaseline="baseline">
          <Image
            priority
            fill
            src="/ArcadeMachine.svg"
            alt="arcade-machine"
            className="z-0 object-contain"
          />

          <div className="mx-auto mt-[15px] h-[150px] w-[1550px]">
            <ArcadeHeader />
          </div>

          <div className="relative mx-auto mt-[100px] grid h-[775px] w-[1375px] grid-cols-2 gap-x-10 px-10 py-5">
            {/* Popups */}
            {!showGameInstructions && showGameDetails && (
              <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
                <GameDetails />
              </div>
            )}
            {showGameInstructions && (
              <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
                <GameInstructions />
              </div>
            )}

            <div className="col-span-1 flex flex-col">
              <div className="mb-[12px] h-[133px]">
                <NextMoveTimer />
              </div>
              <div className="h-[600px] w-[600px] self-end">
                <ChessBoard />
              </div>
            </div>
            <div className="col-span-1 flex flex-col">
              <div className="mb-[20px] h-[125px]">
                <PrizePool />
              </div>
              <div className="flex h-[265px]">
                <NextMoveLeaderboard />
              </div>
              <div className="flex-grow">
                <VotingPanel />
              </div>
            </div>
          </div>

          <div className="mx-auto mt-[20px] h-[70px] w-[1475px]">
            <CreatedByModulousLabs />
          </div>

          <div className="mx-auto mt-[-90px] h-[220px] w-[1375px]">
            <ArcadeControls />
          </div>
        </foreignObject>
      </svg>
    </div>
  );

  // return (
  //   <div className="flex h-screen w-screen flex-col items-end justify-end bg-off-black">
  //     <div className="relative mx-auto h-[875px] w-[1250px]">
  //       <Image
  //         priority
  //         fill
  //         src="/ArcadeMachine.svg"
  //         alt="arcade-machine"
  //         className="z-0 object-contain"
  //       />

  //       <div className="absolute top-0 left-0 right-0 bottom-0">
  //         <ArcadeHeader />
  //         <CreatedByModulousLabs />
  //         <ArcadeControls />
  //         <div className="relative mx-[16.5rem] mt-10  h-[410px]">
  //           {showGameDetails && (
  //             <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
  //               <GameDetails />
  //             </div>
  //           )}
  //           {showGameInstructions && (
  //             <div className="absolute top-0 bottom-0 left-0 right-0 z-50 flex flex-row items-center justify-center bg-black bg-opacity-70">
  //               <GameInstructions />
  //             </div>
  //           )}
  //           <div className="relative grid grid-cols-2 gap-x-2 px-7 pt-2">
  //             <div className="col-span-1">
  //               <div className="h-20">
  //                 <NextMoveTimer />
  //               </div>
  //               <ChessBoard />
  //             </div>
  //             <div className="col-span-1">
  //               <div className="h-20">
  //                 <PrizePool />
  //               </div>
  //               <NextMoveLeaderboard />
  //               <VotingPanel />
  //             </div>
  //           </div>
  //         </div>
  //         <div className="absolute bottom-32 left-0 right-0 flex flex-row justify-center">
  //           <button
  //             onClick={getChessBoardFromContract}
  //             className="mr-5 bg-off-black text-off-white"
  //           >
  //             Temporary Button:
  //             <br />
  //             Refetch Chess Board
  //           </button>
  //           <ConnectButton />
  //         </div>
  //       </div>
  //     </div>
  //   </div>
  // );
}
