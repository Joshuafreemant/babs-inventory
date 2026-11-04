import { flushSync } from "react-dom";
import { createRoot } from "react-dom/client";
import html2canvas from "html2canvas-pro";
import { jsPDF } from "jspdf";
import { OrderDocument, type DocKind, type OrderDocData } from "./OrderDoc";
import { apiGet } from "../lib/api";
import { DEFAULT_HERO } from "../lib/heroDefaults";

const A4_W = 595.28; // pt
const A4_H = 841.89; // pt
const MARGIN = 28;

/** Renders the invoice/receipt off-screen, snapshots it, and downloads a PDF. Browser only. */
export async function downloadOrderDocument(kind: DocKind, data: OrderDocData) {
  const eyebrow = await apiGet<{ hero?: { eyebrow?: string } }>("/api/settings")
    .then((s) => s.hero?.eyebrow || DEFAULT_HERO.eyebrow)
    .catch(() => DEFAULT_HERO.eyebrow);

  const host = document.createElement("div");
  host.style.cssText = "position:fixed;left:-10000px;top:0;pointer-events:none;";
  document.body.appendChild(host);
  const root = createRoot(host);

  try {
    flushSync(() => root.render(<OrderDocument kind={kind} data={data} eyebrow={eyebrow} />));
    const node = host.firstElementChild as HTMLElement;

    // wait for fonts + logo so the snapshot isn't missing them
    await document.fonts?.ready;
    await Promise.all(
      Array.from(node.querySelectorAll("img")).map((img) =>
        img.complete
          ? Promise.resolve()
          : new Promise<void>((res) => {
              img.onload = img.onerror = () => res();
            })
      )
    );

    const canvas = await html2canvas(node, { scale: 3, backgroundColor: "#fbfaf6", useCORS: true });

    const imgW = A4_W - MARGIN * 2;
    const imgH = (canvas.height * imgW) / canvas.width;
    const contentH = A4_H - MARGIN * 2;

    const pdf = new jsPDF({ unit: "pt", format: [A4_W, A4_H], orientation: "portrait" });

    if (imgH <= contentH) {
      pdf.addImage(canvas.toDataURL("image/jpeg", 0.95), "JPEG", MARGIN, MARGIN, imgW, imgH);
    } else {
      // too tall for one A4 page — slice the canvas into page-height chunks
      // so it prints as real pages instead of one oversized page a printer clips
      const pxPerPt = canvas.height / imgH;
      const sliceH = Math.floor(contentH * pxPerPt);
      const pageCount = Math.ceil(canvas.height / sliceH);

      const sliceCanvas = document.createElement("canvas");
      sliceCanvas.width = canvas.width;
      const ctx = sliceCanvas.getContext("2d")!;

      for (let page = 0; page < pageCount; page++) {
        const srcY = page * sliceH;
        const thisSliceH = Math.min(sliceH, canvas.height - srcY);
        sliceCanvas.height = thisSliceH;
        ctx.clearRect(0, 0, sliceCanvas.width, thisSliceH);
        ctx.drawImage(canvas, 0, srcY, canvas.width, thisSliceH, 0, 0, canvas.width, thisSliceH);

        if (page > 0) pdf.addPage([A4_W, A4_H], "portrait");
        const thisImgH = (thisSliceH * imgW) / canvas.width;
        pdf.addImage(sliceCanvas.toDataURL("image/jpeg", 0.95), "JPEG", MARGIN, MARGIN, imgW, thisImgH);
      }
    }

    pdf.save(`${kind === "receipt" ? "Receipt" : "Invoice"}-${data.code}.pdf`);
  } finally {
    root.unmount();
    host.remove();
  }
}