import React from "react";
import PerformanceRelises from "@/components/performance/performance-relises";
import Header from "@/components/main/header/header";
import Footer from "@/components/footer/footer";

export default function page() {
    return (
        <div>
            <Header />
            <PerformanceRelises />
            <Footer />
        </div>
    );
}