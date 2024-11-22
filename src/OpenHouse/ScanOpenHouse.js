import React, { useState, useRef, useEffect } from "react";
import { Modal, ModalHeader, ModalBody, ModalFooter } from "reactstrap";
import { BrowserQRCodeReader } from "@zxing/library";
import axios from "axios";

const ScanOpenHouse = () => {
  const [scanResult, setScanResult] = useState("Invalid");
  const [name, setName] = useState("Invalid");
  const [modalOpen, setModalOpen] = useState(false);  // State to control modal visibility
  const [modalMessage, setModalMessage] = useState("");  // State for modal message
  const [modalType, setModalType] = useState("success");  // To determine success or failure modal
  const [isScanning, setIsScanning] = useState(true); // State to track scanning process
  const videoRef = useRef(null);

  useEffect(() => {
    const codeReader = new BrowserQRCodeReader();

    const startScanning = async () => {
      try {
        // Mulai pemindaian QR Code hanya jika masih dalam status scanning
        if (isScanning) {
          const result = await codeReader.decodeFromVideoDevice(null, videoRef.current, (result, error) => {
            if (result) {
              setScanResult(result.getText());
              checkAndUpdateQRCode(result.getText());  // Proceed only if QR Code is found
              setIsScanning(false);  // Stop scanning after reading QR Code
            }
            if (error) {
              console.error("Error:", error);
              setScanResult("Invalid");
              setName("Invalid");
            }
          });
        }
      } catch (err) {
        console.error("Failed to initialize scanner:", err);
        setScanResult("Invalid");
        setName("Invalid");
      }
    };

    startScanning();

    // Cleanup on unmount
    return () => {
      codeReader.reset();
    };
  }, [isScanning]); // Re-run useEffect only when `isScanning` changes

  const checkAndUpdateQRCode = (qrData) => {
    if (qrData === "Invalid") {
      return;  // Don't proceed if QR code is invalid
    }

    // Check QR Code in the database
    axios
      .get(`https://app.rlagency.id/apiopenhouse/check-qrcode.php?qrcode=${qrData}`)
      .then((response) => {
        if (response.data.exists) {
          setName(response.data.name);  // Set name from database response
          updateLog(response.data.phone);  // If QR Code exists, update log
        } else {
          setName("Invalid");
          setScanResult("Invalid");
          showFailureModal();  // Show failure modal if QR code not found
        }
      })
      .catch((error) => {
        console.error("Error checking QR Code:", error);
        setScanResult("Invalid");
        setName("Invalid");
        showFailureModal();  // Show failure modal in case of error
      });
  };

  const updateLog = (phone) => {
    // Update log with current time + 7 hours
    const currentTime = new Date();
    currentTime.setHours(currentTime.getHours() + 7);  // Add 7 hours
    const formattedTime = currentTime.toISOString().slice(0, 19).replace('T', ' '); // Format 'YYYY-MM-DD HH:MM:SS'

    // Send request to update log on the server
    axios
      .post("https://app.rlagency.id/apiopenhouse/update-log.php", {
        phone: phone,
        log: formattedTime,
      })
      .then((response) => {
        if (response.data.success) {
          // Show success modal
          setModalMessage(`Log-In Berhasil!`);
          setModalType("success");
          setModalOpen(true); 
        } else {
          // Show failure modal
          setModalMessage("Log-In Gagal!");
          setModalType("failure");
          setModalOpen(true); 
        }
      })
      .catch((error) => {
        console.error("Error updating log:", error);
        setModalMessage("Log-In Gagal!");
        setModalType("failure");
        setModalOpen(true); 
      });
  };

  const showFailureModal = () => {
    setModalMessage("Log-In Gagal!");
    setModalType("failure");
    setModalOpen(true);  // Open the modal for failure case
  };

  const toggleModal = () => {
    setModalOpen(!modalOpen);  // Toggle modal visibility
    setIsScanning(true);  // After closing the modal, enable scanning again
  };

  return (
    <div className="container">
      <h1>Scan QR Code untuk Open House</h1>

      {/* Video element for QR Code scanning */}
      <div>
        <video ref={videoRef} width="100%" height="auto" style={{ border: "1px solid black" }} />
      </div>

      {/* Display scan result and name */}
      <p><strong>QR Code Result:</strong> {scanResult}</p>
      <p><strong>Nama:</strong> {name}</p>

      {/* Success or Failure Modal */}
      <Modal isOpen={modalOpen} toggle={toggleModal}>
        <ModalHeader toggle={toggleModal}>{modalMessage}</ModalHeader>
        <ModalBody>
          <p><strong>QR Code Result:</strong> {scanResult}</p>
          <p><strong>Nama:</strong> {name}</p>
        </ModalBody>
        <ModalFooter>
          <button className="btn btn-secondary" onClick={toggleModal}>Close</button>
        </ModalFooter>
      </Modal>
    </div>
  );
};

export default ScanOpenHouse;
