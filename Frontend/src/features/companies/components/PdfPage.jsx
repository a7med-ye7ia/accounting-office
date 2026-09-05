import { useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import MainLayout from "../../../shared/layout/MainLayout";
import { getContractById } from "../../../api/contracts";
import { Document, Page, pdfjs } from "react-pdf";
import "react-pdf/dist/Page/TextLayer.css";
import "react-pdf/dist/Page/AnnotationLayer.css";
import { getFileFromPath } from "../../../api/files";

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
    "pdfjs-dist/build/pdf.worker.min.mjs",
    import.meta.url
).toString();

export default function PdfPage() {
    const { pdfId } = useParams();
    const [pdfData, setPdfData] = useState(null);
    const [loading, setLoading] = useState(true);
    const [numPages, setNumPages] = useState(null);
    const [pdfBlobUrl, setPdfBlobUrl] = useState(null);

    const onDocumentLoadSuccess = ({ numPages }) => {
      setNumPages(numPages);
    };

    useEffect(() => {
        const loadPdf = async () => {
            try {
                console.log("pdfId =", pdfId);
                const data = await getContractById(pdfId);
                setPdfData(data);

                console.log("data.filePath =", data.filePath);

                const blob = await getFileFromPath(data.filePath);

                const url = URL.createObjectURL(blob);

                setPdfBlobUrl(url);
            } catch (err) {
                console.error(err);
            } finally {
                setLoading(false);
            }
        };

        loadPdf();
    }, [pdfId]);

    useEffect(() => {
        return () => {
            if (pdfBlobUrl) {
                URL.revokeObjectURL(pdfBlobUrl);
            }
        };
    }, [pdfBlobUrl]);

    if (loading) {
        return <div>Loading...</div>;
    }

    if (!pdfBlobUrl) {
        return <div>PDF could not be loaded.</div>;
    }


    return (
        <MainLayout hidePageHeader>
            <div className="h-[calc(100vh-100px)] p-6">
                <div className="h-full overflow-auto rounded-xl border border-appBorder bg-appSurface shadow-panel">
{/* 
                    <Document
                        file={pdfBlobUrl}
                        onLoadSuccess={onDocumentLoadSuccess}
                    >
                        {Array.from(new Array(numPages), (_, index) => (
                            <Page
                                key={index}
                                pageNumber={index + 1}
                                width={900}
                            />
                        ))}
                    </Document> */}

                    <div>unfinshed (hard coded message)</div>
                </div>
            </div>
        </MainLayout>
    );
}