/* ============================================================
   SITIO EXTERNO (público) — CONFIGURACIÓN DE DATOS
   ------------------------------------------------------------
   El sitio lee 3 Google Sheets publicadas como CSV.
   Estas 3 hojas las ALIMENTA el SharePoint (vía Power Automate):
   HR edita el Excel de SharePoint -> el flujo actualiza estas
   Google Sheets -> el sitio las lee.
   (Google cachea el CSV ~5 min; luego Ctrl+F5 en el sitio.)

   ⚠️ NO cambiar estas URLs ni "detener la publicación" de las
   hojas: el sitio dejaría de leerlas.
   ============================================================ */
window.CAREERS_CONFIG = {
  // VACANTES EXTERNAL (alimentada por SharePoint)
  csvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSCc3keDvKRGLaBH8hnSuO37jnyZPmieZPjx0KEINSayvxQommOxIqSeRDatd2KaA/pub?output=csv",

  // CONTACTOS EXTERNAL (alimentada por SharePoint)
  contactsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTkGfPrNMyKWSS9aG-oKS1yJzIOkwZe-P-N6qEqDZNkxD07Hep2VVn4Bjpu1vOvopf-7SlCjLDDfN0v/pub?output=csv",

  // BENEFICIOS EXTERNAL (alimentada por SharePoint)
  benefitsCsvUrl: "https://docs.google.com/spreadsheets/d/e/2PACX-1vSSlrCnXBBJjaRHKHV5HQz4KAk6M-gJ_d6rKCjVBvxX3KQ3I6VPL6AhZm-mHr2xo-DaRh-K5CDhNN2Z/pub?output=csv"
};
