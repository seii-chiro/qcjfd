/* eslint-disable @typescript-eslint/no-explicit-any */
import { calculateAge } from "@/functions/calculateAge"
import no_img from "@/assets/noimg.png"
import dayjs from "dayjs";
import { useQuery } from "@tanstack/react-query";
import { BASE_URL } from "@/lib/urls";
import { useTokenStore } from "@/store/useTokenStore";
import { Key } from "react";


const IdentificationLandscape = ({ visitor_log }: { visitor_log: any, visitHistory: any[] }) => {
    const token = useTokenStore(state => state.token)
    const visitor = visitor_log?.visitor;

    const { data: visitorVisitHistory } = useQuery({
        queryKey: ['visitor-visit-history', visitor?.person?.id],
        queryFn: async () => {
            const res = await fetch(`${BASE_URL}/api/visit-logs/main-gate-visits/?person_id=${visitor?.person?.id}&limit=4`, {
                headers: {
                    "Content-Type": "application/json",
                    Authorization: `Token ${token}`,
                },
            })
            if (!res.ok) {
                throw new Error("Failed to person's visit history.");
            }
            return res.json();
        },
        enabled: !!token && !!visitor?.person?.id
    })

    const visitHistoryForVisitor = visitorVisitHistory?.results || [];

    // no need to filter since im only getting specific visitors anyway
    // const visitHistoryForVisitor = visitorVisitHistory?.results
    //     ? visitorVisitHistory?.results?.filter(log => log?.person === visitor_log?.person)
    //     : [];

    const sortedVisitHistory = visitHistoryForVisitor
        ?.slice()
        .sort((a: { created_at: string | number | Date; }, b: { created_at: string | number | Date; }) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
        .slice(0, 3);


    const displayedVisitHistory = sortedVisitHistory || [];

    const Info = ({ title, info }: { title: string, info: string | null }) => {
        return (
            <div className="flex items-center">
                <label className="w-56 text-[#8E8E8E]">{title}</label>
                <p className="mt-1 w-full bg-[#F9F9F9] rounded-md h-9 flex items-center pl-3">{info}</p>
            </div>
        )
    }

    const Title = ({ title }: { title: string }) => {
        return (
            <div className="rounded-lg h-fit w-full bg-[#2F3237] text-white py-2 px-2 font-semibold">
                {title}
            </div>
        )
    }

    const Cards = ({ title, img }: { title: string, img?: string }) => {
        const isValidImg = img && img !== `data:image/jpeg;base64,undefined` && img !== `data:image/jpeg;base64,`;
        return (
            <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-[11.05rem] overflow-hidden">
                <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">
                    {title}
                </div>
                <div className="w-full rounded-b-lg bg-white flex-grow flex items-center justify-center">
                    <img
                        src={isValidImg ? img : no_img}
                        className="w-[57%] h-full object-contain"
                        alt={title}
                    />
                </div>
            </div>
        );
    };


    let profileImg = "";

    if (visitor?.person?.media) {
        const frontPicture = visitor?.person?.media?.find(
            (media: { picture_view: string; }) => media?.picture_view === "Front"
        )?.media_binary;

        if (frontPicture) {
            profileImg = `data:image/jpeg;base64,${frontPicture}`;
        }
    }

    const relationshipToPdl = visitor?.pdls?.map((pdl: { relationship_to_pdl: any; }) => pdl?.relationship_to_pdl)
    const requirements = visitor?.person?.media_requirements?.map((requirement: { name: any; }) => requirement?.name)

    const requirementImg = visitor?.person?.media_requirements?.find(
        (requirement: { name: string; }) => requirement?.name?.toLowerCase?.() === "waiver"
    )?.direct_image;

    const cohabitationRequirementImg = visitor?.person?.media_requirements?.find(
        (requirement: { name: string; }) => requirement?.name?.toLowerCase?.() === "cohabitation"
    )?.direct_image;

    const leftViewImg = visitor?.person?.media?.find(
        (media: { media_description: string; }) => media?.media_description?.toLowerCase?.() === "left-side view picture"
    )?.media_binary;

    const rightViewImg = visitor?.person?.media?.find(
        (media: { media_description: string; }) => media?.media_description?.toLowerCase?.() === "right-side view picture"
    )?.media_binary;

    const fullBodyViewImg = visitor?.person?.media?.find(
        (media: { media_description: string; }) => media?.media_description?.toLowerCase?.() === "full-body front picture"
    )?.media_binary;

    const signatureImg = visitor?.person?.media?.find(
        (media: { media_description: string; }) => media?.media_description?.toLowerCase?.() === "signature picture"
    )?.media_binary;

    const rightThumbImg = visitor?.person?.biometrics?.find(
        (media: { position: string; }) => media?.position?.toLowerCase?.() === "finger_right_thumb"
    )?.data

    const address = visitor?.person?.addresses?.[0];

    const addressParts = [
        address?.bldg_subdivision,
        address?.street_number,
        address?.street,
        address?.barangay,
        address?.municipality,
        address?.province,
        address?.country,
        address?.postal_code
    ];

    const hasAnyAddress = addressParts.some(Boolean);

    console.log("Visitor Info", visitor)

    return (
        <div>
            <div className={`w-full min-h-screen flex flex-col space-y-3`}>
                <div className="w-full text-center py-5 bg-[#2F3237] text-[#FFEFEF]">
                    <h1 className="font-medium font-lg">QUEZON CITY JAIL FEMALE DORM</h1>
                    <h2 className="font-bold text-3xl">VISITORS CODE IDENTIFICATION</h2>
                </div>
                <div className="bg-white py-2 md:py-8 px-2 md:px-10 w-full flex gap-4">
                    <section className="flex-[2] flex flex-col gap-4">

                        <div className="w-full flex gap-4">
                            <div className="grid grid-cols-1 gap-4 flex-1">
                                <div className="border rounded-xl p-4 flex flex-col gap-4 shadow-md shadow-[#8E8E8E]/20 bh-white h-fit">
                                    <div className="bg-[#C4C4C4] w-full h-64 md:min-h-96 rounded-xl overflow-hidden object-cover">
                                        {
                                            profileImg && (<img src={profileImg} alt="Profile Picture" className="w-full h-full object-contain" />)
                                        }
                                    </div>
                                    <div className="border h-fit border-[#EAEAEC] rounded-xl py-2 px-3 overflow-hidden">
                                        <p className="text-[#404958] text-sm">Visitor History</p>
                                        <div className="overflow-y-auto h-full">
                                            <div>
                                                <table className="w-full border-collapse">
                                                    <thead>
                                                        <tr>
                                                            <th className="rounded-l-lg bg-[#2F3237] text-white py-1 px-2 font-semibold text-xs">Date</th>
                                                            <th className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-xs">Duration</th>
                                                            <th className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-xs">Login</th>
                                                            <th className="rounded-r-lg bg-[#2F3237] text-white py-1 px-2 font-semibold text-xs">Logout</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {displayedVisitHistory && displayedVisitHistory.length > 0 ? (
                                                            displayedVisitHistory.map((visit: { timestamp_in: string | number | Date; timestamp_out: string | number | Date; duration: any; isCurrent: any; }, index: Key | null | undefined) => {
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
                            </div>
                            <div className="w-full space-y-2 flex-1">
                                {/* Visitor's Basic Info Section */}
                                <div className="space-y-4">
                                    <div className="border border-[#EAEAEC] shadow-md shadow-[#8E8E8E]/20 rounded-xl p-4 w-full">
                                        <p className="text-[#404958] font-semibold">Visitors/Dalaw Basic Info</p>
                                        <div className="grid grid-cols-1 mt-2 gap-3.5">
                                            <Info title="Type of Visitor:" info={visitor?.visitor_type || "N/A"} />
                                            <Info title="Surname:" info={visitor?.person?.last_name || "N/A"} />
                                            <Info title="First Name:" info={visitor?.person?.first_name || "N/A"} />
                                            <Info title="Middle Name:" info={visitor?.person?.middle_name || "N/A"} />
                                            <Info
                                                title="Address:"
                                                info={hasAnyAddress
                                                    ? addressParts?.filter(Boolean)?.join(' ')
                                                    : 'N/A'}
                                            />
                                            <Info title="Gender:" info={visitor?.person?.gender?.gender_option || "N/A"} />
                                            <Info title="Age:" info={String(calculateAge(visitor?.person?.date_of_birth)) || "N/A"} />
                                            <Info title="Birthday:" info={visitor?.person?.date_of_birth} />
                                            <Info title="Relationship to PDL:" info={relationshipToPdl?.join(", ") || "N/A"} />
                                            <Info title="Requirements:" info={requirements?.join(", ") || "N/A"} />
                                        </div>
                                    </div>
                                </div>

                            </div>
                        </div>

                        <div className="w-full border shadow-md shadow-[#8E8E8E]/20 border-[#EAEAEC] rounded-xl p-5 flex flex-col gap-4 h-full">
                            <div className="w-full flex">
                                <p className="text-[#404958] font-semibold flex-1 text-center">PDL Basic Info</p>
                                <p className="text-[#404958] font-semibold flex-1 text-center">Cell Assigned</p>
                            </div>
                            <div className="flex">
                                <div className="w-full">
                                    <div className="rounded-l-lg bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        PDL No.
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div
                                            key={pdl?.pdl?.id}
                                            className="rounded-l-lg border-l border-t border-b border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2"
                                        >
                                            {pdl?.pdl?.id || "N/A"}
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        Surname
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div key={pdl?.pdl?.id} className="border-b border-t border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                            {pdl?.pdl?.person?.last_name || "N/A"}
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        FirstName
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div key={pdl?.pdl?.id} className="border-b border-t border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                            {pdl?.pdl?.person?.first_name || "N/A"}
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        Middle Name
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div key={pdl?.pdl?.id} className="border-b border-t border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                            {pdl?.pdl?.person?.middle_name || "N/A"}
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        Level
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => {
                                        const match = pdl?.pdl?.cell?.floor?.match(/\(([^)]+)\)/);
                                        const wordInside = match ? match[1] : null;
                                        return (
                                            <div key={pdl?.pdl?.id} className="border-b border-t border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                                {wordInside || "N/A"}
                                            </div>
                                        )
                                    })}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] text-white py-1 px-2 font-semibold text-center">
                                        Annex
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div key={pdl?.pdl?.id} className="border-b border-t border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                            {pdl?.pdl?.cell?.floor?.replace(/\s*\(.*?\)\s*/g, "")}
                                        </div>
                                    ))}
                                </div>
                                <div className="w-full">
                                    <div className="bg-[#2F3237] rounded-r-lg text-white py-1 px-2 font-semibold text-center">
                                        Dorm
                                    </div>
                                    {visitor?.pdls?.map((pdl: any) => (
                                        <div key={pdl?.pdl?.id} className="border-b border-t border-r rounded-lg border-[#DCDCDC] flex flex-col gap-2 text-center font-light p-1 mt-2">
                                            {pdl?.pdl?.cell?.cell_name}
                                        </div>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </section>
                    <div className="border border-[#EAEAEC] rounded-xl p-4 md:p-2 space-y-2 shadow-md shadow-[#8E8E8E]/20 bg-white flex-1">
                        <div className=" grid grid-cols-1 text-center md:grid-cols-2 gap-2">
                            <div className="space-y-2">
                                <Title title="Waiver" />
                                <Cards title="Waiver 1" img={requirementImg ? `data:image/jpeg;base64,${requirementImg}` : no_img} />
                            </div>
                            <div className="space-y-2">
                                <Title title="Requirement" />
                                <Cards title="Cohabitation" img={cohabitationRequirementImg ? `data:image/jpeg;base64,${cohabitationRequirementImg}` : no_img} />
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <Title title="Identification Markings" />
                            <div className=" grid grid-cols-1 text-center md:grid-cols-2 gap-2">
                                <div className="border flex flex-col rounded-xl border-[#EAEAEC] h-[11.05rem] overflow-hidden">
                                    <div className="w-full bg-white rounded-t-xl text-[#404958] text-xs py-1.5 font-semibold">
                                        Right Thumbmark
                                    </div>
                                    <div className="w-full flex items-center justify-center rounded-b-lg bg-white flex-grow">
                                        <img
                                            src={rightThumbImg ? `data:image/jpeg;base64,${rightThumbImg}` : no_img}
                                            className="w-[55%] h-full object-contain"
                                            alt="Right Thumbmark"
                                        />
                                    </div>
                                </div>
                                <Cards title="Signature" img={signatureImg ? `data:image/jpeg;base64,${signatureImg}` : no_img} />
                            </div>
                        </div>
                        <div className="space-y-2 text-center">
                            <Title title="Identification Pictures" />
                            <div className=" grid grid-cols-1 text-center md:grid-cols-2 gap-2">
                                <Cards title="Close Up Front" img={profileImg || no_img} />
                                <Cards title="Full Body Front" img={fullBodyViewImg ? `data:image/jpeg;base64,${fullBodyViewImg}` : no_img} />
                            </div>
                            <div className=" grid grid-cols-1 text-center md:grid-cols-2 gap-2">
                                <Cards title="Left Side" img={leftViewImg ? `data:image/jpeg;base64,${leftViewImg}` : no_img} />
                                <Cards title="Right Side" img={rightViewImg ? `data:image/jpeg;base64,${rightViewImg}` : no_img} />
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    )
}

export default IdentificationLandscape