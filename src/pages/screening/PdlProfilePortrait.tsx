import { useRef } from 'react';
import noimg from "@/assets/noimg.png"
import dayjs from 'dayjs';
import { useQuery } from '@tanstack/react-query';
import { useTokenStore } from '@/store/useTokenStore';
import { fetchSettings } from '@/lib/additionalQueries';

const Info = ({ title, info }: { title: string, info: string }) => (
    <div className="flex items-center">
        <label className="w-48 text-[10px] text-[#8E8E8E]">{title}</label>
        <p className="mt-1 block w-full bg-[#F9F9F9] rounded-md text-xs px-2 py-[1px]">
            {info || 'N/A'}
        </p>
    </div>
);

const Image = ({ src, alt, className }: { src: string, alt: string, className: string }) => (
    <img src={src} alt={alt} className={className} />
);

type PdlProfilePortraitProps = {
    visitorData?: {
        id?: string;
        risk_classification?: string;
        person?: {
            last_name?: string;
            first_name?: string;
            middle_name?: string;
            addresses?: { full_address?: string }[];
            gender?: { gender_option?: string };
            date_of_birth?: string;
            media?: {
                media_description?: string;
                media_binary?: string;
                name?: string;
                direct_image?: string;
            }[];
            media_requirements?: {
                name?: string;
                direct_image?: string;
            }[];
            biometrics?: {
                position?: string;
                data?: string;
            }[];
        };
        pdl_station_visits?: {
            created_at: string;
            timestamp_in: string;
            timestamp_out?: string;
            duration?: number;
            isCurrent?: boolean;
        }[];
        visitor?: {
            visitor_reg_no?: string;
            person?: string;
            visitor_type?: string;
            visitor_app_status?: number;
        }[];
        visitors_from_pdl?: {
            visitor_reg_no?: string;
            person?: {
                first_name?: string;
                middle_name?: string;
                last_name?: string;
            };
            visitor_type?: string;
            visitor_app_status?: number;
        }[];
    };
};

const PdlProfilePortrait = ({ visitorData = {} }: PdlProfilePortraitProps) => {
    const token = useTokenStore()?.token
    const modalContentRef = useRef(null);
    const selectedVisitor = visitorData || {};

    // console.log(selectedVisitor)

    // const { data: visitorStatus } = useQuery({
    //     queryKey: ['visitor-app-status'],
    //     queryFn: () => getVisitorAppStatus(token ?? ""),
    //     staleTime: 10 * 60 * 1000
    // })

    const { data: settingsData } = useQuery({
        queryKey: ['global-settings'],
        queryFn: () => fetchSettings(token ?? ""),
        enabled: !!selectedVisitor?.id
    });

    let ProfileImage = "";
    if (visitorData?.person?.media) {
        const frontPicture = visitorData?.person?.media?.find(
            (media) => media?.media_description === "Close-Up Front Picture"
        )?.media_binary;

        if (frontPicture) {
            ProfileImage = `data:image/jpeg;base64,${frontPicture}`;
        }
    }

    const sortedVisitHistory = visitorData?.pdl_station_visits
        ?.slice()
        .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);

    const displayedVisitHistory = sortedVisitHistory || []
    const waiverData = visitorData?.person?.media_requirements?.find(media => media?.name?.toLowerCase() === "waiver") || {};
    const CohabitationData = visitorData?.person?.media_requirements?.find(media => media?.name?.toLowerCase() === "cohabitation") || {};
    const RightThumb = visitorData?.person?.biometrics?.find(biometric => biometric?.position?.toLowerCase() === "finger_right_thumb") || {};
    const Signature = visitorData?.person?.media?.find(media => media?.media_description?.toLowerCase() === "signature picture") || {};
    const fullBodyFrontIage = visitorData?.person?.media?.find(media => media?.media_description?.toLowerCase() === "full-body front picture") || {};
    const leftSideImage = visitorData?.person?.media?.find(media => media?.media_description?.toLowerCase() === "left-side view picture") || {};
    const RightImage = visitorData?.person?.media?.find(media => media?.media_description?.toLowerCase() === "right-side view picture") || {};

    // Helper function to calculate age
    const calculateAge = (dateOfBirth: string | Date) => {
        if (!dateOfBirth) return 0;
        const today = new Date();
        const birthDate = new Date(dateOfBirth);
        let age = today.getFullYear() - birthDate.getFullYear();
        const monthDiff = today.getMonth() - birthDate.getMonth();
        if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < birthDate.getDate())) {
            age--;
        }
        return age;
    };

    return (
        <div className="flex flex-col items-center justify-center">
            <div ref={modalContentRef} className="w-full max-w-xl space-y-3">
                <div className="w-full text-center py-1 bg-[#2F3237] text-[#FFEFEF]">
                    <h1 className="text-xs font-medium">QUEZON CITY JAIL FEMALE DORM</h1>
                    <h2 className="font-bold">PDL CODE IDENTIFICATION</h2>
                </div>
                <div className="md:px-3 space-y-2">
                    <div className="grid grid-cols-1 md:grid-cols-2 space-y-3 md:space-y-0 md:space-x-3">
                        <div className="space-y-3 w-full flex flex-col">
                            <div className="border border-[#EAEAEC] rounded-xl p-2 flex place-items-center">
                                <div className="w-full h-56 rounded-xl">
                                    {ProfileImage ? (
                                        <img
                                            src={ProfileImage}
                                            alt="Profile Picture"
                                            className="w-full h-full object-cover rounded-lg"
                                        />
                                    ) : (
                                        <img
                                            src={noimg}
                                            alt="No Image"
                                            className="w-full h-full object-contain p-5 bg-gray-100 rounded-lg"
                                        />
                                    )}
                                </div>
                            </div>
                            <div className="border h-fit border-[#EAEAEC] rounded-xl py-2 px-3 overflow-hidden">
                                <p className="text-[#404958] text-sm">PDL Visit History</p>
                                <div className="overflow-y-auto h-full">
                                    <div>
                                        <table className="w-full border-collapse overflow-x-auto">
                                            <thead>
                                                <tr>
                                                    <th className="rounded-l-lg bg-[#2F3237] text-white text-xs py-1 px-2 font-semibold">Date</th>
                                                    <th className="bg-[#2F3237] text-white text-xs py-1 px-2 font-semibold">Duration</th>
                                                    <th className="bg-[#2F3237] text-white text-xs py-1 px-2 font-semibold">Login</th>
                                                    <th className="rounded-r-lg bg-[#2F3237] text-white text-xs py-1 px-2 font-semibold">Logout</th>
                                                </tr>
                                            </thead>
                                            <tbody>
                                                {displayedVisitHistory && displayedVisitHistory.length > 0 ? (
                                                    displayedVisitHistory.map((visit, index) => {
                                                        const login = new Date(visit.timestamp_in);
                                                        const logout = visit.timestamp_out ? new Date(visit.timestamp_out) : null;
                                                        const duration_in_sec = visit?.duration ? visit?.duration : 0;
                                                        let durationDisplay = "...";
                                                        if (visit.timestamp_out) {
                                                            const minutes = Math.floor(duration_in_sec / 60);
                                                            const hours = Math.floor(minutes / 60);
                                                            if (duration_in_sec < 60) {
                                                                durationDisplay = `${duration_in_sec?.toFixed(0)}s`;
                                                            } else if (minutes < 60) {
                                                                durationDisplay = `${minutes}m`;
                                                            } else {
                                                                durationDisplay = `${hours}h ${minutes % 60}m`;
                                                            }
                                                        }
                                                        return (
                                                            <tr key={index}>
                                                                <td className="border-b border-[#DCDCDC] text-[9px] font-light p-1 text-center">
                                                                    {dayjs(login).format("YYYY-MM-DD")}
                                                                </td>
                                                                <td className="border-b border-[#DCDCDC] text-[9px] font-light p-1 text-center">
                                                                    {!visit.timestamp_out ? "..." : durationDisplay}
                                                                </td>
                                                                <td className="border-b border-[#DCDCDC] text-[9px] font-light p-1 text-center">
                                                                    {login.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                                                                </td>
                                                                <td className="border-b border-[#DCDCDC] text-[9px] font-light p-1 text-center">
                                                                    {visit.isCurrent ? <span className="text-green-600 font-semibold">...</span> : (logout
                                                                        ? logout.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                                                                        : "-")}
                                                                </td>
                                                            </tr>
                                                        );
                                                    })
                                                ) : (
                                                    <tr>
                                                        <td colSpan={4} className="text-center text-xs py-2">No visit history found.</td>
                                                    </tr>
                                                )}
                                            </tbody>
                                        </table>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="space-y-3">
                            <div className="border border-[#EAEAEC] rounded-xl p-2 pb-2 w-full">
                                <p className="text-[#404958] text-sm">PDL Basic Info</p>
                                <div className="grid grid-cols-1 gap-1.5 py-1">
                                    <Info title="PDL No:" info={selectedVisitor?.id ?? ""} />
                                    <Info title="Risk Classification:" info={selectedVisitor?.risk_classification ?? ""} />
                                    <Info title="Surname:" info={selectedVisitor?.person?.last_name || ""} />
                                    <Info title="First Name:" info={selectedVisitor?.person?.first_name || ""} />
                                    <Info title="Middle Name:" info={selectedVisitor?.person?.middle_name || ""} />
                                    <Info title="Address:" info={selectedVisitor?.person?.addresses?.[0]?.full_address || ''} />
                                    <Info title="Gender:" info={selectedVisitor?.person?.gender?.gender_option || ""} />
                                    <Info title="Age:" info={selectedVisitor?.person?.date_of_birth ? String(calculateAge(selectedVisitor?.person?.date_of_birth)) : ""} />
                                    <Info title="Birthday:" info={selectedVisitor?.person?.date_of_birth || ""} />
                                    <Info title="Visit Day Schedule:" info={settingsData?.results?.[0]?.schedule_day || ""} />
                                    <Info
                                        title="Visit Time Schedule:"
                                        info={
                                            (() => {
                                                const start = settingsData?.results?.[0]?.schedule_time_start ?? "";
                                                const end = settingsData?.results?.[0]?.schedule_time_end ?? "";
                                                let durationStr = "";
                                                if (start && end) {
                                                    // Parse as dayjs objects
                                                    const startTime = dayjs(start, "HH:mm:ss");
                                                    const endTime = dayjs(end, "HH:mm:ss");
                                                    let duration = endTime.diff(startTime, "minute");
                                                    // Handle overnight schedules (end < start)
                                                    if (duration < 0) {
                                                        duration += 24 * 60;
                                                    }
                                                    const hours = Math.floor(duration / 60);
                                                    const minutes = duration % 60;
                                                    durationStr = `(${hours}${minutes > 0 ? `h ${minutes}m` : "h"})`;
                                                }
                                                return `${start} - ${end} ${durationStr}`;
                                            })()
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className="border border-[#EAEAEC] rounded-xl p-2 w-full">
                        <div className="w-full flex flex-col">
                            <div className="flex text-center mb-1">
                                <div className="flex-grow">
                                    <h1 className="text-[#404958] text-sm">Visitor Basic Info</h1>
                                </div>
                                {/* <div className="flex-grow">
                                    <h1 className="text-[#404958] text-sm">Cell Assigned</h1>
                                </div> */}
                            </div>
                            <div className="overflow-y-auto pb-1">
                                <table className="w-full border-collapse">
                                    <thead>
                                        <tr className="bg-[#2F3237] text-white text-xs">
                                            <th className="py-1 px-2">Visitor No.</th>
                                            <th className="py-1 px-2">Full Name</th>
                                            <th className="py-1 px-2">Visitor Type</th>
                                            <th className="py-1 px-2">Visitor Status</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {(selectedVisitor?.visitors_from_pdl ?? []).length > 0 ? (
                                            (selectedVisitor?.visitors_from_pdl ?? []).map((pdlItem, index) => (
                                                <tr key={index}>
                                                    <td className="text-center text-[9px] font-light">
                                                        {pdlItem?.visitor_reg_no || "N/A"}
                                                    </td>
                                                    <td className="text-center text-[9px] font-light">
                                                        {`${pdlItem?.person?.first_name ?? ""} ${pdlItem?.person?.middle_name ?? ""} ${pdlItem?.person?.last_name ?? ""}`}
                                                    </td>
                                                    <td className="text-center text-[9px] font-light">
                                                        {pdlItem?.visitor_type || "N/A"}
                                                    </td>
                                                    <td className="text-center text-[9px] font-light">
                                                        {pdlItem?.visitor_app_status || "N/A"}
                                                    </td>
                                                </tr>
                                            ))
                                        ) : (
                                            <tr>
                                                <td colSpan={7} className="text-center text-[9px] text-gray-500 py-2">
                                                    No visitor records found.
                                                </td>
                                            </tr>
                                        )}
                                    </tbody>
                                </table>
                            </div>
                        </div>
                    </div>
                </div>
                <div className="md:mx-3 border border-[#EAEAEC] rounded-xl p-2 flex flex-col space-y-2 place-items-center bg-white">
                    <div className="w-full flex flex-wrap gap-2 text-center">
                        <div className="flex flex-col md:flex-row gap-2">
                            <div className="flex flex-col md:flex-row gap-2">
                                {/* Waiver */}
                                <div className="space-y-2">
                                    <div className="rounded-lg bg-[#2F3237] text-white py-[2px] px-2 font-semibold text-xs">
                                        Waiver
                                    </div>
                                    <div className="border flex flex-col w-full rounded-xl border-[#EAEAEC] h-32">
                                        <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Waiver 1</div>
                                        <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                            {waiverData?.direct_image ? (
                                                <div className="w-[7.6rem]">
                                                    <Image
                                                        src={`data:image/png;base64,${waiverData?.direct_image}`}
                                                        alt="Waiver"
                                                        className="w-full md:w-[7.6rem] h-full object-cover rounded-b-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <img
                                                    className="w-full md:max-w-[7.75rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg"
                                                    src={noimg}
                                                    alt="No Image"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                                <div className="space-y-2">
                                    <div className="rounded-lg bg-[#2F3237] text-white py-[2px] px-2 font-semibold text-xs">
                                        Requirement
                                    </div>
                                    <div className="border flex flex-col w-full rounded-xl border-[#EAEAEC] h-32">
                                        <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Cohabitation</div>
                                        <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                            {CohabitationData?.direct_image ? (
                                                <div>
                                                    <Image
                                                        src={`data:image/png;base64,${CohabitationData?.direct_image}`}
                                                        alt="Waiver"
                                                        className="w-full md:max-w-[7.76rem] h-full object-cover rounded-b-lg"
                                                    />
                                                </div>
                                            ) : (
                                                <img className="w-full md:max-w-[7.75rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg" src={noimg} alt="No Image" />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                            <div className="space-y-2">
                                <div className="rounded-lg w-full bg-[#2F3237] text-white py-[2px] px-2 font-semibold text-xs">
                                    Identification Marking
                                </div>
                                <div className="flex flex-col md:flex-row gap-2 w-full">
                                    <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                        <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Right Thumbmark</div>
                                        <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                            {RightThumb?.data ? (
                                                <Image
                                                    src={`data:image/bmp;base64,${RightThumb?.data}`}
                                                    alt="Right Thumb"
                                                    className="w-full md:max-w-[7.76rem] h-full object-cover rounded-b-lg"
                                                />
                                            ) : (
                                                <img className="w-full md:max-w-[7.75rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg" src={noimg} alt="No Image" />
                                            )}
                                        </div>
                                    </div>
                                    <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                        <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Signature</div>
                                        <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                            {Signature?.media_binary ? (
                                                <Image
                                                    src={`data:image/bmp;base64,${Signature?.media_binary}`}
                                                    alt="Signature"
                                                    className="w-full md:max-w-[7.76rem] h-full object-cover rounded-b-lg"
                                                />
                                            ) : (
                                                <img
                                                    src={noimg}
                                                    alt="No Image"
                                                    className="w-full md:max-w-[7.7rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg"
                                                />
                                            )}
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </div>
                        <div className="w-full space-y-2 text-center">
                            <div className="rounded-lg w-full bg-[#2F3237] text-white py-[2px] px-2 font-semibold text-xs">
                                Identification Pictures
                            </div>
                            <div className="w-full grid grid-cols-1 md:grid-cols-4 gap-2">
                                <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                    <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Close Up Front</div>
                                    <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                        {ProfileImage ? (
                                            <Image
                                                src={ProfileImage}
                                                alt="Left side"
                                                className="w-full h-full object-cover rounded-b-lg"
                                            />
                                        ) : (
                                            <img className="w-full md:max-w-[7.7rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg" src={noimg} alt="No Image" />
                                        )}
                                    </div>
                                </div>
                                <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                    <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Full Body Front</div>
                                    <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                        {fullBodyFrontIage?.media_binary ? (
                                            <Image
                                                src={`data:image/bmp;base64,${fullBodyFrontIage?.media_binary}`}
                                                alt="Left side"
                                                className="w-full h-full object-contain rounded-b-lg"
                                            />
                                        ) : (
                                            <img className="w-full md:max-w-[7.7rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg" src={noimg} alt="No Image" />
                                        )}
                                    </div>
                                </div>
                                <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                    <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Left Side</div>
                                    <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                        {leftSideImage?.media_binary ? (
                                            <Image
                                                src={`data:image/bmp;base64,${leftSideImage?.media_binary}`}
                                                alt="Left side"
                                                className="w-full h-full object-cover rounded-b-lg"
                                            />
                                        ) : (
                                            <img className="w-full md:max-w-[7.7rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg" src={noimg} alt="No Image" />
                                        )}
                                    </div>
                                </div>
                                <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-32">
                                    <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">Right Side</div>
                                    <div className="rounded-b-lg bg-white flex-grow flex items-center justify-center overflow-hidden">
                                        {RightImage?.media_binary ? (
                                            <Image
                                                src={`data:image/bmp;base64,${RightImage?.media_binary}`}
                                                alt="Right side"
                                                className="w-full h-full object-cover rounded-b-lg"
                                            />
                                        ) : (
                                            <img
                                                src={noimg}
                                                alt="No Image"
                                                className="w-full md:max-w-[7.7rem] h-full object-contain p-5 bg-gray-100 rounded-b-lg"
                                            />
                                        )}
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default PdlProfilePortrait