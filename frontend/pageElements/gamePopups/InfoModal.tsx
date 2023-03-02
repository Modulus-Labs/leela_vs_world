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
    <Modal
      ariaHideApp={false}
      isOpen={showInfoModal}
      style={{
        content: {
          top: "50%",
          left: "50%",
          right: "auto",
          bottom: "auto",
          marginRight: "-50%",
          transform: "translate(-50%, -50%)",
          maxWidth: "80%",
          backgroundColor: "white",
        },
      }}
    >
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
    </Modal>
  );
};
