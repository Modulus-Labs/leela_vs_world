import Modal from "react-modal";
import { useArcadeMachineContext } from "../../contexts/ArcadeMachineContext";
import { BasicModal } from "../../components/modals/BasicModal";
import { OutlineButton } from "../../components/buttons/OutlineButton";

// --- To display messages to user ---
export const InfoModal = () => {
  const {
    showInfoModal,
    setShowInfoModal,
    infoModalDismissVisible,
    infoModalText,
  } = useArcadeMachineContext();

  return (
    <BasicModal>
      <div
        style={{
          flex: 1,
          display: "flex",
          alignItems: "center",
          flexDirection: "column",
        }}
      >
        <span style={{ fontSize: 15, marginBottom: 10 }}>{infoModalText}</span>
        {infoModalDismissVisible && (
          <OutlineButton
            text="Okay"
            onClick={() => {
              setShowInfoModal(false);
            }}
          />
        )}
      </div>
    </BasicModal>
  );
};
