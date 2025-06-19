/* eslint-disable @typescript-eslint/no-explicit-any */
import { CustomFingerResponse, FingerprintData } from '@/lib/scanner-definitions'
import { captureFingerprints, getScannerInfo, uninitScanner, verifyFingerprint } from '@/lib/scanner-queries'
import { useMutation } from '@tanstack/react-query'
import { Checkbox, message, Select } from 'antd'
import { useEffect, useMemo, useState } from 'react'
import no_img from "@/assets/no-img.png"
import check from "@/assets/Icons/check-mark.png"
import ex from "@/assets/Icons/close.png"
import { useTokenStore } from '@/store/useTokenStore'
import { BASE_URL } from '@/lib/urls'
import { Device } from '@/lib/definitions'
import VisitorProfilePortrait from '../../VisitorProfilePortrait'
import { PaginatedResponse } from '@/lib/queries'
import { useSystemSettingsStore } from '@/store/useSystemSettingStore'
import PdlProfilePortrait from '../../PdlProfilePortrait'

type Props = {
    devices: PaginatedResponse<Device>;
    deviceLoading: boolean;
    selectedArea: string;
}

const Finger = ({ deviceLoading, devices, selectedArea }: Props) => {
    const [lastScanned, setLastScanned] = useState<any | null>(null);
    const token = useTokenStore()?.token;
    const fingerScannerTimeout = useSystemSettingsStore(state => state.fingerScannerTimeout);

    const [selectedDeviceId, setSelectedDeviceId] = useState<number | null>(null);
    // const [isFetching, setIsFetching] = useState(false);
    const [error, setError] = useState<Error | null>(null);

    const [lastScannedPdl, setLastScannedPdl] = useState<any | null>(null);

    const [fingerScannerReady, setFingerScannerReady] = useState(false)
    const [LeftFingerResponse, setLeftFingerResponse] = useState<CustomFingerResponse | null>(null)
    const [RightFingerResponse, setRightFingerResponse] = useState<CustomFingerResponse | null>(null)
    const [ThumbFingerResponse, setThumbFingerResponse] = useState<CustomFingerResponse | null>(null)
    const [fingerprintVerificationResult, setFingerprintVerificationResult] = useState<any[] | null>(null)
    const [capturePayload, setCapturePayload] = useState<FingerprintData>({
        TimeOut: +fingerScannerTimeout || 60,
        Slap: 0,
        FingerPosition: {
            LEFT_LITTLE: true,
            LEFT_RING: true,
            LEFT_MIDDLE: true,
            LEFT_INDEX: false,
            RIGHT_INDEX: false,
            RIGHT_MIDDLE: true,
            RIGHT_RING: true,
            RIGHT_LITTLE: true,
            LEFT_THUMB: true,
            RIGHT_THUMB: false,
        },
        NFIQ_Quality: 20
    })

    const SlapOptions = [
        { label: "Left Hand", value: 0 },
        { label: "Right Hand", value: 1 },
        { label: "Thumbs", value: 2 },
    ]

    const NFIQ_Quality_Options = [10, 20, 30, 40, 50]

    useEffect(() => {
        setCapturePayload(prev => ({
            ...prev,
            TimeOut: +fingerScannerTimeout || 60
        }))
    }, [fingerScannerTimeout]);

    const fingerprintDevices = useMemo(
        () =>
            devices?.results?.filter((device: { device_name: string }) =>
                device?.device_name?.toLowerCase().includes("fingerprint")
            ) || [],
        [devices]
    );

    useEffect(() => {
        if (!deviceLoading && fingerprintDevices.length > 0) {
            setSelectedDeviceId(fingerprintDevices[0].id);
        }
    }, [deviceLoading, fingerprintDevices]);

    const fingerScannerUninitThenInitMutation = useMutation({
        mutationKey: ['finger-scanner-uninit'],
        mutationFn: uninitScanner,
        onSuccess: () => {
            fingerScannerInitMutation.mutate();
        },
        onError: (error) => {
            console.error(error.message);
        }
    });

    const fingerScannerInitMutation = useMutation({
        mutationKey: ['finger-scanner-init'],
        mutationFn: getScannerInfo,
        onSuccess: () => {
            setFingerScannerReady(true);
            message.info("Fingerprint Scanner Ready")
        },
        onError: (error) => {
            console.error(error.message);
            message.info("Error Initializing Fingerprint Scanner")
        }
    });

    const fingerScannerCaptureMutation = useMutation({
        mutationKey: ['finger-scanner-init'],
        mutationFn: () => captureFingerprints(capturePayload),
        onSuccess: (data) => {
            if (capturePayload.Slap === 0) {
                setLeftFingerResponse(prev => ({
                    ...prev,
                    CapturedFingers: data.CaptureData?.CapturedFingers,
                    GraphicalPlainBitmap: data.CaptureData?.GraphicalPlainBitmap
                }))
            } else if (capturePayload.Slap === 1) {
                setRightFingerResponse(prev => ({
                    ...prev,
                    CapturedFingers: data.CaptureData?.CapturedFingers,
                    GraphicalPlainBitmap: data.CaptureData?.GraphicalPlainBitmap
                }))
            } else if (capturePayload.Slap === 2) {
                setThumbFingerResponse(prev => ({
                    ...prev,
                    CapturedFingers: data.CaptureData?.CapturedFingers,
                    GraphicalPlainBitmap: data.CaptureData?.GraphicalPlainBitmap
                }))
            }

            if (data?.ErrorDescription === "Success") {
                message.success(data?.ErrorDescription)
                // Automatically verify after successful capture
                setTimeout(() => {
                    handleVerifyFingerprints();
                }, 300); // slight delay to ensure state is updated
            } else {
                message.error(data?.ErrorDescription)
            }
        },
        onError: (error) => {
            console.error(error.message);
            message.error("Error scanning fingerprint: " + error?.message)
        }
    });

    const verifyFingerprintMutation = useMutation({
        mutationKey: ['fingerprint-verification'],
        mutationFn: verifyFingerprint,
        onMutate: () => {
            message.open({
                key: 'fingerprint-verification',
                type: 'loading',
                content: 'Verifying person’s fingerprint(s)...',
                duration: 0,
            });
        },
        onSuccess: (data) => {
            setFingerprintVerificationResult((prev: any[] | null) => {
                const updatedResults = prev?.filter(item => item.data[0]?.subject_id !== data?.data[0]?.subject_id) || [];
                return [...updatedResults, data];
            });
            message.open({
                key: 'fingerprint-verification',
                type: 'warning',
                content: 'Match Found',
                duration: 3,
            });
        },
        onError: (error) => {
            console.error("Biometric enrollment failed:", error);
            message.open({
                key: 'fingerprint-verification',
                type: 'info',
                content: 'Match Not Found',
                duration: 3,
            });
        },
    });

    const handleVerifyFingerprints = () => {
        if (!selectedDeviceId) {
            message.warning("Please select a device.");
            return;
        }

        const leftFingers = LeftFingerResponse?.CapturedFingers || [];
        const rightFingers = RightFingerResponse?.CapturedFingers || [];
        const thumbFingers = ThumbFingerResponse?.CapturedFingers || [];

        // Process left fingers
        for (let i = 0; i < 4; i++) {
            const template = leftFingers[i]?.FingerBitmapStr;
            if (template) {
                verifyFingerprintMutation.mutate({ template, type: 'fingerprint' });
            }
        }

        // Process right fingers
        for (let i = 0; i < 4; i++) {
            const template = rightFingers[i]?.FingerBitmapStr;
            if (template) {
                verifyFingerprintMutation.mutate({ template, type: 'fingerprint' });
            }
        }

        // Process thumb fingers
        for (let i = 0; i < 2; i++) {
            const template = thumbFingers[i]?.FingerBitmapStr;
            if (template) {
                verifyFingerprintMutation.mutate({ template, type: 'fingerprint' });
            }
        }
    }

    useEffect(() => {
        const fetchVisitorLog = async () => {
            // setIsFetching(true);
            setError(null);

            const isPDLStation = selectedArea?.toLowerCase() === "pdl station";

            try {
                let id_number: string | null = null;
                let binary_data: string | null = null;
                let person_id: string | null = null;
                let pdlId: string | null = null;

                if (isPDLStation) {
                    person_id = fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.id;
                    pdlId = fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.pdl?.id

                    if (!person_id) {
                        if (fingerprintVerificationResult) {
                            message.warning("No person ID found.");
                        }
                        return;
                    }

                    const res = await fetch(`${BASE_URL}/api/pdls/pdl/${pdlId}`, {
                        method: 'get',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                    });

                    if (!res.ok) throw new Error(`Failed to fetch PDL.`);
                    const pdlData = await res.json();

                    setLastScannedPdl(pdlData);

                } else {
                    id_number = fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.visitor?.id_number;
                    person_id = fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.id;

                    if (!id_number) {
                        message.warning("No ID number found for visitor.");
                        return;
                    }

                    const res = await fetch(`${BASE_URL}/api/visit-logs/visitor-specific/?id_number=${id_number}`, {
                        method: 'GET',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                    });

                    if (!res.ok) {
                        throw new Error(`Failed to fetch visitor log.`);
                    }

                    const data = await res.json();
                    id_number = data.id_number;
                    binary_data = data.encrypted_id_number_qr;

                    setLastScanned(data);
                }

                // URLs
                let visitsUrl = "";
                let trackingUrl = "";

                switch (selectedArea?.toLowerCase()) {
                    case "main gate":
                        visitsUrl = `${BASE_URL}/api/visit-logs/main-gate-visits/`;
                        trackingUrl = `${BASE_URL}/api/visit-logs/main-gate-tracking/`;
                        break;
                    case "visitor station":
                        visitsUrl = `${BASE_URL}/api/visit-logs/visitor-station-visits/`;
                        trackingUrl = `${BASE_URL}/api/visit-logs/visitor-station-tracking/`;
                        break;
                    case "pdl station":
                        visitsUrl = `${BASE_URL}/api/visit-logs/pdl-station-visits/`;
                        trackingUrl = `${BASE_URL}/api/visit-logs/pdl-station-tracking/`;
                        break;
                    default:
                        message.error("Unknown area. Cannot post visit.");
                        return;
                }

                // POST visit log
                const visitBody = isPDLStation
                    ? { device_id: selectedDeviceId, person_id }
                    : { device_id: selectedDeviceId, id_number, binary_data, person_id };

                if (!selectedDeviceId) {
                    message.warning("Please select a device.");
                    return;
                }

                const postRes = await fetch(visitsUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json',
                        'Authorization': `Token ${token}`
                    },
                    body: JSON.stringify(visitBody)
                });

                if (!postRes.ok) {
                    throw new Error(`Failed to log visit.`);
                }

                const visitLogResponse = await postRes.json();
                message.success("Visit logged successfully!");

                // POST visit tracking
                if (visitLogResponse?.id) {
                    const trackingRes = await fetch(trackingUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Token ${token}`
                        },
                        body: JSON.stringify({ visit_id: visitLogResponse.id })
                    });

                    if (!trackingRes.ok) {
                        throw new Error(`Failed to log visit tracking.`);
                    }

                    message.success("Visit tracking created successfully!");
                    message.success("Process Complete!");
                } else {
                    message.warning("Missing visit ID for tracking");
                }

            } catch (err: any) {
                message.warning(isPDLStation ? "No person ID provided." : "No ID number provided.");
                message.error(`Error: ${err.message}`);
                setError(err);
            }
        };

        fetchVisitorLog();
    }, [token, setLastScanned, selectedDeviceId, fingerprintVerificationResult, selectedArea]);

    useEffect(() => {
        // Only run if a new capture was successful
        if (
            (LeftFingerResponse && capturePayload.Slap === 0) ||
            (RightFingerResponse && capturePayload.Slap === 1) ||
            (ThumbFingerResponse && capturePayload.Slap === 2)
        ) {
            handleVerifyFingerprints();
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [LeftFingerResponse, RightFingerResponse, ThumbFingerResponse]);

    // if (isFetching) {
    //     message.info("Processing scan...");
    // }

    if (error) {
        message.error(`Error: ${error.message}`);
    }

    useEffect(() => {
        fingerScannerUninitThenInitMutation.mutate();
    }, []);

    return (
        <div className='w-full h-full flex flex-col gap-4 justify-center items-center mt-5'>
            <div className='w-full flex gap-10'>
                <div className="flex flex-col gap-5 flex-1">
                    <div className="flex w-full gap-5">
                        <div className=" flex-1 flex flex-col gap-4">
                            <div className="p-4 border border-black">
                                <h2 className="w-full text-center mb-6 font-bold">Capture Settings</h2>
                                <div className="flex gap-5">
                                    <div className="flex flex-col gap-5 flex-[3]">
                                        <div className="w-full flex gap-5 items-center flex-1">
                                            <p className="flex-1">Slap Selection</p>
                                            <Select
                                                className="h-[2.2rem] flex-[2]"
                                                showSearch
                                                value={capturePayload?.Slap}
                                                placeholder="Hand Selection"
                                                optionFilterProp="label"
                                                onChange={(value) => {
                                                    setCapturePayload(prevPayload => (
                                                        {
                                                            ...prevPayload,
                                                            Slap: value,
                                                        }
                                                    ))
                                                }}
                                                options={SlapOptions?.map(slap => (
                                                    {
                                                        value: slap.value,
                                                        label: slap.label,
                                                    }
                                                ))}
                                            />
                                        </div>
                                        <div className="flex gap-5 items-center">
                                            <p className="flex-1">Exception</p>
                                            <div className="flex-[2]">
                                                {
                                                    capturePayload.Slap === 0 ? (
                                                        <>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.LEFT_LITTLE}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, LEFT_LITTLE: e.target.checked } }))}
                                                            >
                                                                Little
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.LEFT_RING}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, LEFT_RING: e.target.checked } }))}
                                                            >
                                                                Ring
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.LEFT_MIDDLE}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, LEFT_MIDDLE: e.target.checked } }))}
                                                            >
                                                                Middle
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.LEFT_INDEX}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, LEFT_INDEX: e.target.checked } }))}
                                                            >
                                                                Index
                                                            </Checkbox>
                                                        </>
                                                    ) : capturePayload.Slap === 1 ? (
                                                        <>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.RIGHT_INDEX}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, RIGHT_INDEX: e.target.checked } }))}
                                                            >
                                                                Index
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.RIGHT_MIDDLE}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, RIGHT_MIDDLE: e.target.checked } }))}
                                                            >
                                                                Middle
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.RIGHT_RING}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, RIGHT_RING: e.target.checked } }))}
                                                            >
                                                                Ring
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.RIGHT_LITTLE}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, RIGHT_LITTLE: e.target.checked } }))}
                                                            >
                                                                Little
                                                            </Checkbox>
                                                        </>
                                                    ) : (
                                                        <>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.LEFT_THUMB}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, LEFT_THUMB: e.target.checked } }))}
                                                            >
                                                                Left Thumb
                                                            </Checkbox>
                                                            <Checkbox
                                                                checked={capturePayload.FingerPosition.RIGHT_THUMB}
                                                                onChange={(e) => setCapturePayload(prevPayload => ({ ...prevPayload, FingerPosition: { ...prevPayload.FingerPosition, RIGHT_THUMB: e.target.checked } }))}
                                                            >
                                                                Right Thumb
                                                            </Checkbox>
                                                        </>
                                                    )
                                                }
                                            </div>
                                        </div>
                                        <div className="w-full flex gap-5 items-center flex-1">
                                            <p className="flex-1">NFIQ Quality</p>
                                            <Select
                                                className="h-[2.2rem] flex-[2]"
                                                showSearch
                                                value={capturePayload?.NFIQ_Quality}
                                                placeholder="Hand Selection"
                                                optionFilterProp="label"
                                                onChange={(value) => {
                                                    setCapturePayload(prevPayload => (
                                                        {
                                                            ...prevPayload,
                                                            NFIQ_Quality: value,
                                                        }
                                                    ))
                                                }}
                                                options={NFIQ_Quality_Options?.map(slap => (
                                                    {
                                                        value: slap,
                                                        label: slap,
                                                    }
                                                ))}
                                            />
                                        </div>
                                    </div>
                                    <div className="flex flex-col gap-2 flex-1">
                                        {
                                            fingerScannerReady ? (
                                                <button
                                                    onClick={() => {
                                                        if (!selectedDeviceId) {
                                                            message.warning("Please select a device.")
                                                            return
                                                        }

                                                        fingerScannerCaptureMutation.mutate()
                                                    }}
                                                    type="button"
                                                    className="bg-[#1976D2] text-white px-10 py-2 rounded-md">
                                                    Start Capture
                                                </button>
                                            ) : (
                                                <button
                                                    type="button"
                                                    className="bg-[#1976D2] text-white px-10 py-2 rounded-md cursor-not-allowed">
                                                    Loading Scanner...
                                                </button>
                                            )
                                        }
                                        {
                                            // LeftFingerResponse?.CapturedFingers || RightFingerResponse?.CapturedFingers || ThumbFingerResponse?.CapturedFingers ? (
                                            //     verifyFingerprintMutation?.isPending ? (
                                            //         <button
                                            //             type="button"
                                            //             className="bg-[#1976D2] text-white px-10 py-2 rounded-md">
                                            //             Verifying Fingerprints
                                            //             <span className="animate-bounceDot1">.</span>
                                            //             <span className="animate-bounceDot2">.</span>
                                            //             <span className="animate-bounceDot3">.</span>
                                            //         </button>
                                            //     ) : (
                                            //         <button
                                            //             onClick={handleVerifyFingerprints}
                                            //             type="button"
                                            //             className="bg-[#1976D2] text-white px-10 py-2 rounded-md">
                                            //             Verify Fingerprints
                                            //         </button>
                                            //     )
                                            // ) : (
                                            //     <button
                                            //         // onClick={() => {
                                            //         //     enrollAllFingersMutation.mutate(LeftFingerResponse?.CapturedFingers?.[0].FingerBitmapStr)
                                            //         // }}
                                            //         type="button"
                                            //         className="bg-[#1976D2] text-white px-10 py-2 rounded-md cursor-not-allowed opacity-25">
                                            //         Verify Fingerprints
                                            //     </button>
                                            // )
                                        }
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>


                    {
                        capturePayload?.Slap === 0 ? (
                            <div className="w-full border border-black flex flex-col">
                                <div className="w-full flex flex-col items-center justify-center gap-5 p-5">
                                    <h2 className="text-center font-semibold">Left Hand</h2>
                                    <div className="w-full grid grid-cols-2 gap-2">
                                        {["LEFT_INDEX", "LEFT_MIDDLE", "LEFT_RING", "LEFT_LITTLE"].reverse().map((finger) => {
                                            const isSkipped = capturePayload.FingerPosition[finger as keyof typeof capturePayload.FingerPosition];

                                            // Find the correct image for the current finger
                                            const imageIndex = Object.keys(capturePayload.FingerPosition)
                                                .filter((key) => !capturePayload.FingerPosition[key as keyof typeof capturePayload.FingerPosition]) // Get all non-skipped fingers
                                                .indexOf(finger); // Find the index of the current finger in the non-skipped list

                                            const imageSrc =
                                                imageIndex !== -1
                                                    ? `data:image/bmp;base64,${LeftFingerResponse?.CapturedFingers?.[imageIndex]?.FingerBitmapStr}`
                                                    : no_img;

                                            return (
                                                <div
                                                    key={finger}
                                                    className={`flex-1 border border-black ${isSkipped && "opacity-20"}`}
                                                >
                                                    <p className="w-full bg-[#1E365D] text-white text-center">
                                                        {finger.replace("LEFT_", "").replace("_", " ")}
                                                    </p>
                                                    <div className="h-52">
                                                        <img
                                                            className="w-full h-full object-contain"
                                                            src={imageSrc}
                                                            alt={`${finger} fingerprint`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : capturePayload.Slap === 1 ? (
                            <div className="w-full border border-black flex flex-col">
                                <div className="w-full flex flex-col items-center justify-center gap-5 p-5">
                                    <h2 className="text-center font-semibold">Right Hand</h2>
                                    <div className="w-full grid grid-cols-2 gap-2">
                                        {["RIGHT_INDEX", "RIGHT_MIDDLE", "RIGHT_RING", "RIGHT_LITTLE"].map((finger) => {
                                            const isSkipped = capturePayload.FingerPosition[finger as keyof typeof capturePayload.FingerPosition];

                                            // Dynamically calculate the image index for the current finger
                                            const imageIndex = Object.keys(capturePayload.FingerPosition)
                                                .filter((key) => !capturePayload.FingerPosition[key as keyof typeof capturePayload.FingerPosition] && key.startsWith("RIGHT_")) // Get all non-skipped right-hand fingers
                                                .indexOf(finger); // Find the index of the current finger in the non-skipped list

                                            const imageSrc =
                                                imageIndex !== -1
                                                    ? `data:image/bmp;base64,${RightFingerResponse?.CapturedFingers?.[imageIndex]?.FingerBitmapStr}`
                                                    : ""; // If no image, leave the box empty

                                            return (
                                                <div
                                                    key={finger}
                                                    className={`flex-1 border border-black ${isSkipped && "opacity-20"}`}
                                                >
                                                    <p className="w-full bg-[#1E365D] text-white text-center">
                                                        {finger.replace("RIGHT_", "").replace("_", " ")}
                                                    </p>
                                                    <div className="h-52">
                                                        <img
                                                            className="w-full h-full object-contain"
                                                            src={imageSrc}
                                                            alt={`${finger} fingerprint`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="w-full border border-black flex items-center justify-center">
                                <div className="w-full flex flex-col items-center justify-center gap-5 p-5">
                                    <h2 className="text-center font-semibold">Both Thumbs</h2>
                                    <div className="w-full grid grid-cols-2 gap-2">
                                        {["LEFT_THUMB", "RIGHT_THUMB"].map((finger) => {
                                            const isSkipped = capturePayload?.FingerPosition[finger as keyof typeof capturePayload.FingerPosition];

                                            // Dynamically calculate the image index for the current finger
                                            const imageIndex = Object.keys(capturePayload.FingerPosition)
                                                .filter((key) => !capturePayload.FingerPosition[key as keyof typeof capturePayload.FingerPosition] && (key === "LEFT_THUMB" || key === "RIGHT_THUMB")) // Get all non-skipped thumbs
                                                .indexOf(finger); // Find the index of the current finger in the non-skipped list

                                            const imageSrc =
                                                imageIndex !== -1
                                                    ? `data:image/bmp;base64,${ThumbFingerResponse?.CapturedFingers?.[imageIndex]?.FingerBitmapStr}`
                                                    : no_img; // If no image, leave the box empty

                                            return (
                                                <div
                                                    key={finger}
                                                    className={`flex-1 border border-black ${isSkipped && "opacity-20"}`}
                                                >
                                                    <p className="w-full bg-[#1E365D] text-white text-center">
                                                        {finger.replace("_", " ").replace("THUMB", " Thumb")}
                                                    </p>
                                                    <div className="h-52">
                                                        <img
                                                            className="w-full h-full object-contain"
                                                            src={imageSrc}
                                                            alt={`${finger} fingerprint`}
                                                        />
                                                    </div>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </div>
                        )
                    }
                </div>
                {
                    selectedArea?.toLowerCase() === "pdl station" ? (
                        // <div className='flex-1'>
                        //     <div className="flex flex-col items-center justify-center">
                        //         <div className="w-full flex items-center justify-center flex-col gap-10">
                        //             <div className="w-[60%] rounded-md overflow-hidden object-cover">
                        //                 {
                        //                     fingerprintVerificationResult?.[0]?.data?.[0]?.additional_biometrics?.find((bio: { position: string }) => bio?.position === "face")?.data ? (
                        //                         <img src={`data:image/jpeg;base64,${fingerprintVerificationResult?.[0]?.data?.[0]?.additional_biometrics?.find((bio: { position: string }) => bio?.position === "face")?.data}`} alt="Image of a person" className="w-full" />
                        //                     ) : (
                        //                         <img src={noImg} alt="Image of a person" className="w-full" />
                        //                     )
                        //                 }
                        //             </div>
                        //             <h1 className="text-4xl font-semibold">
                        //                 {`${fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.first_name ?? ""} ${fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.middle_name ?? ""} ${fingerprintVerificationResult?.[0]?.data?.[0]?.biometric?.person_data?.last_name ?? ""}`}
                        //             </h1>
                        //         </div>
                        //         {
                        //             lastScanned && (
                        //                 <div className="w-full flex items-center justify-center">
                        //                     <div className="w-[50%] text-3xl flex">
                        //                         <div className="flex items-center justify-between w-full">
                        //                             <div className="flex-[2] flex gap-12">

                        //                                 <>
                        //                                     <span>STATUS:</span>
                        //                                     <span>ALLOWED VISIT</span>
                        //                                 </>

                        //                             </div>
                        //                             <div className="flex justify-end flex-1 gap-4">
                        //                                 <div className="w-10">
                        //                                     <img src={check} alt="check icon" />
                        //                                 </div>
                        //                                 {/* <div className="w-10">
                        //                                     <img src={ex} alt="close icon" />
                        //                                 </div> */}
                        //                             </div>
                        //                         </div>
                        //                     </div>
                        //                 </div>
                        //             )
                        //         }
                        //     </div>
                        // </div>
                        <div className="flex-1">
                            <PdlProfilePortrait visitorData={lastScannedPdl} />
                        </div>
                    ) : (
                        <div className='flex-1'>
                            <div className='w-full flex items-center justify-center'>
                                {
                                    lastScanned?.visitor_app_status && (
                                        <div className="flex items-center justify-center gap-5">
                                            <h1 className="font-bold text-2xl text-green-700">{lastScanned?.visitor_app_status}</h1>
                                            {lastScanned?.visitor_app_status === "Verified" ? (
                                                <img src={check} className="w-10" alt="Check" />
                                            ) : (
                                                <img src={ex} className="w-10" alt="Close" />
                                            )}
                                        </div>
                                    )
                                }
                            </div>
                            <VisitorProfilePortrait visitorData={lastScanned} />
                        </div>
                    )
                }
            </div>
            <div className="w-full flex gap-3 items-center">
                <span className="font-semibold">DEVICE ID:</span>
                <Select
                    loading={deviceLoading}
                    showSearch
                    optionFilterProp="label"
                    className="h-10 w-72"
                    options={fingerprintDevices.map(device => ({
                        label: device?.device_name,
                        value: device?.id
                    }))}
                    value={selectedDeviceId || undefined}
                    onChange={value => {
                        setSelectedDeviceId(value)
                    }}
                    placeholder="Select a device"
                />
            </div>
        </div>

    )
}

export default Finger