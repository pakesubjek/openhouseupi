import React, { useState } from "react";
import { Form, FormGroup, Label, Input, Button, Modal, ModalHeader, ModalBody, ModalFooter, Alert, FormFeedback } from "reactstrap";
import { useFormik } from "formik";
import * as Yup from "yup";
import axios from "axios";
import { QRCodeCanvas } from "qrcode.react";
import html2canvas from "html2canvas";

const schools = [
  "SMAN 4 Padang",
  "SMAN 14 Padang",
  "SMAS Adabiah 1 Padang",
  "SMAS Kartika 1-5 Padang",
  "SMAS Pertiwi 1 Padang",
  "SMKN 4 Padang",
];

const FormOpenHouse = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState(null);
  const [alertMessage, setAlertMessage] = useState(null); // State to store alert message

  const toggleModal = () => setModalOpen(!modalOpen);

  const formik = useFormik({
    initialValues: {
      nama: "",
      hp: "",
      email: "",
      gender: "",
      school: "",
    },
    validationSchema: Yup.object({
      nama: Yup.string().required("Nama harus diisi"),
      hp: Yup.string()
        .matches(
          /^(0\d{9,17}|(\+62)\d{9,17})$/,
          "Nomor HP tidak valid"
        )
        .required("Nomor HP harus diisi"),
      email: Yup.string().email("Email tidak valid").required("Email harus diisi"),
      gender: Yup.string().required("Jenis kelamin harus dipilih"),
      school: Yup.string().required("Asal sekolah harus dipilih"),
    }),
    onSubmit: (values) => {
      // Format nomor HP
      let formattedHP = values.hp;
      if (formattedHP.startsWith("0")) {
        formattedHP = "62" + formattedHP.slice(1);
      } else if (formattedHP.startsWith("+62")) {
        formattedHP = formattedHP.slice(1);
      }

      // Cek apakah nomor HP sudah terdaftar
      axios
        .get(`https://app.rlagency.id/apiopenhouse/check-phone.php?phone=${formattedHP}`)
        .then((response) => {
          if (response.data.exists) {
            // Jika sudah terdaftar, tampilkan alert
            setAlertMessage(`Anda sudah terdaftar dengan nama ${response.data.name}`);
          } else {
            // Jika belum terdaftar, kirim data ke server
            const qrcodeData = formattedHP * 2;
            const payload = {
              name: values.nama,
              phone: formattedHP,
              gender: values.gender,
              school: values.school,
              qrcode: qrcodeData,
            };

            axios
              .post("https://app.rlagency.id/apiopenhouse/register-peserta.php", payload)
              .then((response) => {
                setFormData({
                  ...values,
                  formattedHP,
                  qrcodeData,
                });
                toggleModal();
                setAlertMessage(null); // Reset alert message on successful registration
              })
              .catch((error) => {
                console.error("Error submitting form:", error);
                alert("Terjadi kesalahan saat mengirim data.");
              });
          }
        })
        .catch((error) => {
          console.error("Error checking phone:", error);
          alert("Terjadi kesalahan saat memeriksa nomor HP.");
        });
    },
  });

  const downloadIDCardAsImage = () => {
    const modalContent = document.getElementById("modal-content");
    html2canvas(modalContent).then((canvas) => {
      const imageUrl = canvas.toDataURL("image/jpeg");
      const link = document.createElement("a");
      link.href = imageUrl;
      link.download = `${formData.nama}-idcard.jpg`;
      link.click();
    });
  };

  return (
    <div className="container" style={{ padding: "20px", maxWidth:'700px' }}>
      <h1 style={{ textAlign: "center", marginBottom: "30px", fontSize: "32px" }}>Form Kehadiran Open House <br/>UPI YPTK 2024</h1>
      <hr/>
      <p>Bagi adik-adik siswa SMA yang diundang untuk hadir di acara Open House UPI YPTK Padang tahun 2024, silahkan mengisi form berikut :</p>

      {/* Alert Message */}
      {alertMessage && <Alert color="danger">{alertMessage}</Alert>}

      <Form onSubmit={formik.handleSubmit}>
        <FormGroup>
          <Label for="nama">Nama</Label>
          <Input
            id="nama"
            name="nama"
            type="text"
            value={formik.values.nama}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.nama && formik.errors.nama}
          />
          {formik.touched.nama && formik.errors.nama && <FormFeedback>{formik.errors.nama}</FormFeedback>}
        </FormGroup>

        <FormGroup>
          <Label for="hp">HP</Label>
          <Input
            id="hp"
            name="hp"
            type="text"
            value={formik.values.hp}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.hp && formik.errors.hp}
          />
          {formik.touched.hp && formik.errors.hp && <FormFeedback>{formik.errors.hp}</FormFeedback>}
        </FormGroup>

        <FormGroup>
          <Label for="email">Email</Label>
          <Input
            id="email"
            name="email"
            type="email"
            value={formik.values.email}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.email && formik.errors.email}
          />
          {formik.touched.email && formik.errors.email && <FormFeedback>{formik.errors.email}</FormFeedback>}
        </FormGroup>

        <FormGroup>
          <Label for="gender">Jenis Kelamin</Label>
          <Input
            type="select"
            name="gender"
            id="gender"
            value={formik.values.gender}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.gender && formik.errors.gender}
          >
            <option value="">Pilih Jenis Kelamin</option>
            <option value="Laki-laki">Laki-laki</option>
            <option value="Perempuan">Perempuan</option>
          </Input>
          {formik.touched.gender && formik.errors.gender && <FormFeedback>{formik.errors.gender}</FormFeedback>}
        </FormGroup>

        <FormGroup>
          <Label for="school">Asal Sekolah</Label>
          <Input
            type="select"
            name="school"
            id="school"
            value={formik.values.school}
            onChange={formik.handleChange}
            onBlur={formik.handleBlur}
            invalid={formik.touched.school && formik.errors.school}
          >
            <option value="">Pilih Sekolah</option>
            {schools.map((school, index) => (
              <option key={index} value={school}>
                {school}
              </option>
            ))}
          </Input>
          {formik.touched.school && formik.errors.school && <FormFeedback>{formik.errors.school}</FormFeedback>}
        </FormGroup>

        <Button color="primary" type="submit">
          Submit
        </Button>
      </Form>

      {/* Information Box */}
      <div style={{
        marginTop: "30px",
        padding: "20px",
        border: "2px solid #ccc",
        borderRadius: "10px",
        backgroundColor: "#f9f9f9",
        fontSize: "16px"
      }}>
        <h5 style={{ fontWeight: "bold" }}>Informasi Terkait :</h5>
        <ul style={{ listStyleType: "disc", marginLeft: "20px" }}>
          <li>Setelah mengisi form, adik-adik akan mendapatkan barcode kehadiran. Silahkan di download dan disimpan.</li>
          <li>Barcode juga dikirimkan ke email. Pastikan Email yang didaftarkan adalah Email aktif yang digunakan.</li>
          <li>Tunjukkan BARCODE kepada panitia saat memasuki RUANGAN ACARA sebagai BUKTI KEHADIRAN.</li>
        </ul>
      </div>

      {/* Modal */}
      {formData && (
        <Modal isOpen={modalOpen} toggle={toggleModal} size="sm">
          <ModalHeader toggle={toggleModal}>Detail Pendaftaran</ModalHeader>
          <ModalBody id="modal-content" style={{ display: "flex", justifyContent: "center", alignItems: "center", padding: "30px" }}>
            <div style={{
              width: "300px",
              border: "2px solid #000",
              padding: "10px",
              textAlign: "center",
              borderRadius: "10px",
            }}>
              <div style={{ fontSize: "16px", fontWeight: "bold" }}>
                <h5>{formData.nama}</h5>
                <p>{formData.school}</p>
              </div>
              <div style={{ marginTop: "10px" }}>
                <QRCodeCanvas value={formData.qrcodeData.toString()} />
              </div>
            </div>
          </ModalBody>
          <ModalFooter>
            <Button color="primary" onClick={toggleModal}>
              Close
            </Button>
            <Button color="secondary" onClick={downloadIDCardAsImage}>
              Download ID Card (JPEG)
            </Button>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
};

export default FormOpenHouse;
