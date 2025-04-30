import { Suspense } from "react";
import RestorePass from "@/components/restore/restore-pass";

export const dynamic = 'force-dynamic';

export default function Page() {
    return (
        <div className="page-container">
            <Suspense fallback={<div className="loading-spinner-container"><div className="loading-spinner"></div></div>}>
                <RestorePass />
            </Suspense>
        </div>
    );
}