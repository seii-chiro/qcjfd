import { Button, message, Modal, Table } from "antd";
import { useState } from "react";
import { AiOutlineDelete } from "react-icons/ai";
import { GoPlus } from "react-icons/go";
import AddBranch from "./AddBranch";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { BRANCH, COURT } from "@/lib/urls";
import { getJail_Province, getJailRegion } from "@/lib/queries";

type CourtProps = {
    id: number;
    created_by: string;
    updated_by: string;
    record_status: string;
    created_at: string;
    updated_at: string;
    court: string;
    description: string;
    code: string;
    jurisdiction: string;
    example_offenses: string;
    relevance_to_pdl: string;
    court_level: string;
};

type BranchProps = {
    court_id?: number;
    region_id: number;
    province_id: number;
    branch: string;
    judge: string;
    court?: string; 
    region?: string; 
    province?: string; 
};

const AddCourt = ({ onClose }: { onClose: () => void }) => {
    const token = useTokenStore().token;
    const [messageApi, contextHolder] = message.useMessage();
    const queryClient = useQueryClient();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [branches, setBranches] = useState<BranchProps[]>([]);
    const [courtForm, setCourtForm] = useState<CourtProps>({
        id: 0, 
        created_by: '', 
        updated_by: '', 
        record_status: '', 
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        court: '',
        description: '',
        code: '',
        jurisdiction: '',
        example_offenses: '',
        relevance_to_pdl: '',
        court_level: '',
    });

    const addCourt = async (court: CourtProps) => {
        const res = await fetch(COURT.postCOURT, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(court),
        });

        if (!res.ok) throw new Error("Error adding court");
        const responseData = await res.json();
        return responseData;
    };

    const addBranch = async (branch: BranchProps) => {
        const response = await fetch(BRANCH.postBRANCH, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(branch),
        });

        const text = await response.text();

        if (!response.ok) {
            throw new Error(`Error adding branch: ${text}`);
        }

        return JSON.parse(text);
    };

    const courtMutation = useMutation({
        mutationKey: ['court'],
        mutationFn: addCourt,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: ["court"] });
            const court_id = data?.id || data?.court_id;
            if (!court_id) {
                messageApi.error("Court ID is missing in the response");
                return;
            }

            branches.forEach((branch) => {
                branchMutation.mutate({ 
                    court_id,
                    region_id: branch.region_id,
                    province_id: branch.province_id,
                    branch: branch.branch,
                    judge: branch.judge,
                });
            });

            messageApi.success("Court and branches submitted!");
            onClose();
        },
        onError: (err: any) => {
            messageApi.error(err.message || "Error adding court");
        },
    });

    const branchMutation = useMutation({
        mutationKey: ['branch'],
        mutationFn: addBranch,
        onError: (err: any) => {
            messageApi.error(err.message || "Error adding branch");
        },
    });

    const showModal = () => setIsModalOpen(true);
    const handleCancel = () => setIsModalOpen(false);

    const handleCourtSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        if (!courtForm.court || !courtForm.description || branches.length === 0) {
            messageApi.error("Please fill all fields and add at least one branch.");
            return;
        }
        courtMutation.mutate(courtForm);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setCourtForm((prev) => ({ ...prev, [name]: value }));
    };

    const handleRemoveBranch = (index: number) => {
        setBranches((prev) => prev.filter((_, i) => i !== index));
    };
    const results = useQueries({
        queries: [
            {
                queryKey: ["region"],
                queryFn: () => getJailRegion(token ?? ""),
            },
            {
                queryKey: ["province"],
                queryFn: () => getJail_Province(token ?? ""),
            },
        ],
    });

    const RegionData = results[0].data?.results || [];
    const ProvinceData = results[1].data?.results || [];

    const columns = [
        { title: 'Court', dataIndex: 'court', key: 'court' },
        {
            title: 'Region',
            dataIndex: 'region_id',
            key: 'region_id',
            render: (regionId) => Array.isArray(RegionData) ? RegionData.find(region => region.id === regionId)?.desc || 'N/A' : 'N/A',
        },
        {
            title: 'Province',
            dataIndex: 'province_id',
            key: 'province_id',
            render: (provinceId) => Array.isArray(ProvinceData) ? ProvinceData.find(province => province.id === provinceId)?.desc || 'N/A' : 'N/A',
        },
        { title: 'Branch', dataIndex: 'branch', key: 'branch' },
        { title: "Judge's Name", dataIndex: 'judge', key: 'judge' },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, __: any, index: number) => (
                <Button danger onClick={() => handleRemoveBranch(index)}>
                    <AiOutlineDelete />
                </Button>
            ),
        },
    ];
    return (
        <div>
            {contextHolder}
            <h1 className="text-[#1E365D] font-bold text-lg mb-4">Add Judicial Court</h1>
            <form onSubmit={handleCourtSubmit}>
                <div className="flex flex-col md:flex-row w-full gap-3">
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Code:</h1>
                        <input
                            type="text"
                            name="code"
                            value={courtForm.code}
                            onChange={handleInputChange}
                            placeholder="Code"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Judicial Court Name:</h1>
                        <input
                            type="text"
                            name="court"
                            value={courtForm.court}
                            onChange={handleInputChange}
                            placeholder="Court"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Court Level:</h1>
                        <input
                            type="text"
                            name="court_level"
                            value={courtForm.court_level}
                            onChange={handleInputChange}
                            placeholder="Court Level"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                </div>
                <div className="flex flex-col md:flex-row w-full gap-3">
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Jurisdiction:</h1>
                        <input
                            type="text"
                            name="jurisdiction"
                            value={courtForm.jurisdiction}
                            onChange={handleInputChange}
                            placeholder="Jurisdiction"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Example Offenses:</h1>
                        <input
                            type="text"
                            name="example_offenses"
                            value={courtForm.example_offenses}
                            onChange={handleInputChange}
                            placeholder="Example Offenses"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                    <div className="space-y-2 w-full mt-5">
                        <h1 className="text-[#1E365D] font-bold text-base">Relevance to PDL:</h1>
                        <input
                            type="text"
                            name="relevance_to_pdl"
                            value={courtForm.relevance_to_pdl}
                            onChange={handleInputChange}
                            placeholder="Relevance to PDL"
                            className="h-12 border w-full border-gray-300 rounded-lg px-2"
                        />
                    </div>
                </div>
                <div className="space-y-2 w-full mt-5">
                    <h1 className="text-[#1E365D] font-bold text-base">Description:</h1>
                    <textarea
                        name="description"
                        value={courtForm.description}
                        onChange={handleInputChange}
                        placeholder="Description"
                        className="h-24 border w-full border-gray-300 rounded-lg px-2 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1E365D]"
                    />
                </div>
                <div className="space-y-2">
                    <div className="flex items-center pt-4 pb-2 justify-between">
                        <h1 className="text-[#1E365D] font-bold md:text-lg">Add a Branch Court</h1>
                        <button
                            type="button"
                            onClick={showModal}
                            className="bg-[#1E365D] text-white px-3 py-2 rounded-md flex gap-1 items-center"
                        >
                            <GoPlus />
                            Add Branch
                        </button>
                    </div>
                    <Table
                        columns={columns}
                        dataSource={branches}
                        rowKey={(_, index) => index?.toString() ?? Math.random().toString()}
                        pagination={false}
                    />
                    <div className="flex justify-end gap-2 pt-4">
                        <button
                            type="button"
                            onClick={onClose}
                            className="bg-white border border-[#1e365d] text-[#1e365d] px-3 py-2 rounded-md"
                        >
                            Cancel
                        </button>
                        <button type="submit" className="bg-[#1E365D] text-white px-3 py-2 rounded-md">
                            Save
                        </button>
                    </div>
                </div>
            </form>

            <Modal
                className="rounded-lg scrollbar-hide"
                title="Add A Branch of Philippines Judicial Court"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width="40%"
            >
                <AddBranch
                    courtName={courtForm.court}
                    onAddBranch={(branch) => {
                        // Include region and province in the branch
                        setBranches((prev) => [...prev, { ...branch, court: courtForm.court }]);
                        setIsModalOpen(false);
                    }}
                    onCancel={handleCancel}
                />
            </Modal>
        </div>
    );
};

export default AddCourt;
