import { getRiskLevels } from "@/lib/queries";
import { RISK } from "@/lib/urls";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueries, useQueryClient } from "@tanstack/react-query";
import { message, Select } from "antd";
import { useState } from "react";

type AddRisks = {
    name: string;
    description: string;
    risk_level: number | null;
}
const AddRisk = ({ onClose }: { onClose: () => void }) => {
    const token = useTokenStore().token;
    const [messageApi, contextHolder] = message.useMessage();
    const queryClient = useQueryClient();
    const [selectRisks, setSelectRisks] = useState<AddRisks>({
        name: '',
        description: '',
        risk_level: null,
    });

    const results = useQueries({
        queries: [
            {
                queryKey: ['risk-level'],
                queryFn: () => getRiskLevels(token ?? "")
            }
        ]
    });
    
    const riskLevelData = results[0].data;

    async function addRisk(risk: AddRisks) {
        const res = await fetch(RISK.getRISK, {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
                Authorization: `Token ${token}`,
            },
            body: JSON.stringify(risk),
        });
        if (!res.ok) {
            let errorMessage = "Error Adding Risk";
            try {
                const errorData = await res.json();
                errorMessage =
                    errorData?.message ||
                    errorData?.error ||
                    JSON.stringify(errorData);
            } catch {
                errorMessage = "Unexpected error occurred";
            }
            throw new Error(errorMessage);
        }
        return res.json();
    }

    const riskMutation = useMutation({
        mutationKey: ['risk'],
        mutationFn: addRisk,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ['risk'] });
            messageApi.success("Added successfully");
            onClose();
        },
        onError: (error) => {
            console.error(error);
            messageApi.error(error.message);
        },
    });

    const handleRiskSubmit = (e: React.FormEvent) => {
        e.preventDefault();
        riskMutation.mutate(selectRisks);
    };

    const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { name, value } = e.target;
        setSelectRisks(prevForm => ({
            ...prevForm,
            [name]: value,
        }));
    };

    const onRiskLevelChange = (value: number) => {
        setSelectRisks(prevForm => ({
            ...prevForm,
            risk_level: value
        }));
    };

    return (
        <div>
            {contextHolder}
            <form onSubmit={handleRiskSubmit}>
                <div className="grid grid-cols-1 w-full gap-3">
                    <div>
                        <p className="text-gray-500 font-bold">Risk:</p>
                        <input type="text" name="name" id="name" onChange={handleInputChange} placeholder="Risk" className="h-12 border w-full border-gray-300 rounded-lg px-2" />
                    </div>
                    <div>
                        <p className="text-gray-500 font-bold">Description:</p>
                        <input type="text" name="description" id="description" onChange={handleInputChange} placeholder="Description" className="h-12 border border-gray-300 rounded-lg px-2 w-full" />
                    </div>
                    <div>
                        <p className="text-gray-500 font-bold">Risk Level:</p>
                        <Select
                        className="h-[3rem] w-full"
                        showSearch
                        placeholder="Risk Level"
                        optionFilterProp="label"
                        onChange={onRiskLevelChange}
                        options={riskLevelData?.results?.map(risklevel => (
                            {
                                value: risklevel.id,
                                label: risklevel?.risk_severity,
                            }
                        ))}
                        />
                    </div>
                    
                </div>
                <div className="w-full flex justify-end mt-10">
                    <button type="submit" className="bg-blue-500 text-white w-36 px-3 py-2 rounded font-semibold text-base">
                    Submit
                    </button>
                </div>
            </form>
        </div>
    )
}

export default AddRisk
