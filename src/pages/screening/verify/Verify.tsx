import { useLocation, useNavigate } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";
import { Select } from "antd";
import Rfid from "./scanners/Rfid";
import QrReader from "../qr-reader/QrReader";
import Finger from "./scanners/Finger";
import Face from "./scanners/Face";
import Iris from "./scanners/Iris";
import { useQuery } from "@tanstack/react-query";
import { getDevice } from "@/lib/queries";
import { useTokenStore } from "@/store/useTokenStore";

const Verify = () => {
    const location = useLocation();
    const navigate = useNavigate();
    const token = useTokenStore()?.token

    const { scanners, selectedArea } = location.state || {};

    const selectedScanners = useMemo(() => {
        return scanners ?? [];
    }, [scanners]);


    const [selectedOption, setSelectedOption] = useState(selectedScanners?.[0])

    const { data, isLoading } = useQuery({
        queryKey: ['get-devices', 'qr-reader'],
        queryFn: () => getDevice(token ?? "")
    })

    useEffect(() => {
        if (!selectedScanners.length) {
            navigate("/jvms/screening", { replace: true });
        }
    }, [selectedScanners, navigate]);

    return (
        <div className="p-4">
            <div>
                <section className="flex flex-col gap-1">
                    <h1 className="text-xl">Select a Scanner</h1>
                    <Select
                        value={selectedOption}
                        className="h-10 w-52"
                        options={selectedScanners?.map((scanner: string) => ({
                            label: scanner,
                            value: scanner
                        }))}
                        onChange={value => {
                            setSelectedOption(value)
                        }}
                    />
                </section>
            </div>
            <div>
                {
                    selectedOption === "RFID" ? (
                        <Rfid devices={data || []} deviceLoading={isLoading} selectedArea={selectedArea} />
                    ) : selectedOption === "QR" ? (
                        <QrReader selectedArea={selectedArea} />
                    ) : selectedOption === "Fingerprint" ? (
                        <Finger devices={data || []} deviceLoading={isLoading} selectedArea={selectedArea} />
                    ) : selectedOption === "Face Recognition" ? (
                        <Face devices={data?.results || []} deviceLoading={isLoading} selectedArea={selectedArea} />
                    ) : selectedOption === "Iris" ? (
                        <Iris devices={data || []} deviceLoading={isLoading} selectedArea={selectedArea} />
                    ) : <div>No Scanner Available</div>
                }
            </div>
        </div>
    );
};

export default Verify;
