import { Modal, Table } from "antd";
import { ColumnsType } from "antd/es/table";
import { Plus } from "lucide-react";
import { SetStateAction, useEffect, useState } from "react";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import PDLVisitorForm from "./PdlVisitorForm";
import { PDLForm } from "@/lib/visitorFormDefinition";
import { useQuery } from "@tanstack/react-query";
import { Sibling } from "@/lib/pdl-definitions";
import { getVisitor_to_PDL_Relationship, getVisitorsPaginated } from "@/lib/queries";
import { useTokenStore } from "@/store/useTokenStore";

export type PdlVisitorForm = {
    lastName: string | null;
    firstName: string | null;
    middleName: string | null;
    relationship: number | null;
    visitationStatus: string | null;
    multipleBirthClass: Sibling | null;
}

type PdlVisitorTable = PdlVisitorForm[] | null

type Props = {
    setPdlForm: React.Dispatch<SetStateAction<PDLForm>>;
    pdlForm: PDLForm;
};

const PdlVisitor = ({ pdlForm, setPdlForm }: Props) => {
    const token = useTokenStore()?.token
    const [pdlVisitorTableInfo, setPdlVisitorTableInfo] = useState<PdlVisitorTable>([])

    const [isModalOpen, setIsModalOpen] = useState(false)
    const [editIndex, setEditIndex] = useState<number | null>(null)

    const [visitorSearch, setVisitorSearch] = useState("");
    const [visitorPage, setVisitorPage] = useState(1);
    const [debouncedVisitorSearch, setDebouncedVisitorSearch] = useState(visitorSearch);

    useEffect(() => {
        const handler = setTimeout(() => setDebouncedVisitorSearch(visitorSearch), 400);
        return () => clearTimeout(handler);
    }, [visitorSearch]);

    const {
        data: visitorsPaginated,
        isLoading: visitorsLoading,
    } = useQuery({
        queryKey: ['pdl-visitors', debouncedVisitorSearch, visitorPage],
        queryFn: () => getVisitorsPaginated(token ?? "", 10, debouncedVisitorSearch, visitorPage),
        keepPreviousData: true,
        staleTime: 10 * 60 * 1000,
    });

    const pdlVisitors = visitorsPaginated?.results || [];
    const pdlVisitorsCount = visitorsPaginated?.count || 0;

    const { data: visitorToPdlRelationship, isLoading: visitorToPdlRelationshipLoading } = useQuery({
        queryKey: ['visitors-pdl-realtionship'],
        queryFn: () => getVisitor_to_PDL_Relationship(token ?? "")
    })

    const handleModalOpen = () => {
        setIsModalOpen(true)
    }

    const handleModalClose = () => {
        setIsModalOpen(false)
    }

    const handleEdit = (index: number) => {
        setEditIndex(index)
        setIsModalOpen(true)
    }

    //works fine and i dont have enough time or braincells to refactor this
    // this is a temporary solution to update the pdlForm state when a visitor is deleted

    const handleDelete = (index: number) => {
        const updatedVisitors = [...(pdlVisitorTableInfo || [])];
        updatedVisitors.splice(index, 1);
        setPdlVisitorTableInfo(updatedVisitors);

        // Also update the parent form state if needed
        setPdlForm(prev => ({
            ...prev,
            visitor: updatedVisitors?.map(visitor => ({
                pdl_id: visitor?.relationship ?? 0,
                relationship_to_pdl_id: visitor?.relationship ?? 0,
            })) || [],
            visitor_ids: updatedVisitors?.map(visitor => (visitor?.relationship ?? 0)) || [],
        }));
    };


    const pdlToVisitDataSource = pdlVisitorTableInfo?.map((pdl, index) => {
        return ({
            key: index,
            lastname: pdl?.lastName ?? "N/A",
            firstName: pdl?.firstName ?? "N/A",
            middleName: pdl?.middleName ?? "N/A",
            relationship: visitorToPdlRelationship?.results?.find(relationship => relationship?.id === pdl.relationship)?.relationship_name,
            visitationStatus: pdl?.visitationStatus ?? "N/A",
            birthClassClassification: pdl?.multipleBirthClass?.multiple_birth_class ?? "Single",
            action: (
                <div className="flex gap-1.5 font-semibold transition-all ease-in-out duration-200 justify-center items-center">
                    <button
                        type="button"
                        onClick={() => handleEdit(index)}
                        className="border border-blue-500 text-blue-500 hover:bg-blue-500 hover:text-white py-1 rounded w-10 h-10 flex items-center justify-center"
                    >
                        <AiOutlineEdit />
                    </button>
                    <button
                        type="button"
                        onClick={() => handleDelete(index)}
                        className="border border-red-500 text-red-500 hover:bg-red-500 hover:text-white py-1 rounded flex w-10 h-10 items-center justify-center"
                    >
                        <AiOutlineDelete />
                    </button>
                </div>
            )
        })
    })

    const visitorToPdlRelationshipColumns: ColumnsType<{
        key: number;
        lastname: string
        firstName: string
        middleName: string
        relationship: string | undefined;
        visitationStatus: string
        birthClassClassification: string | undefined;
        action: JSX.Element;
    }> = [
            {
                title: 'Last Name',
                dataIndex: 'lastname',
                key: 'lastname',
            },
            {
                title: 'First Name',
                dataIndex: 'firstName',
                key: 'firstName',
            },
            {
                title: 'Middle Name',
                dataIndex: 'middleName',
                key: 'middleName',
            },
            {
                title: 'Relationship to PDL',
                dataIndex: 'relationship',
                key: 'relationship',
            },
            {
                title: 'Visitor Visitation Status',
                dataIndex: 'visitationStatus',
                key: 'visitationStatus',
            },
            {
                title: 'Multiple Birth Classification',
                dataIndex: 'birthClassClassification',
                key: 'birthClassClassification',
            },
            {
                title: "Actions",
                key: "actions",
                align: 'center',
                dataIndex: 'action'
            },
        ];


    return (
        <div className="flex flex-col gap-5 mt-10">
            <div className="flex justify-between">
                <h1 className='font-bold text-xl'>Visitors</h1>
                <button
                    type="button"
                    onClick={handleModalOpen}
                    className="flex gap-2 px-4 py-2 rounded-md bg-gray-200 hover:bg-gray-400"
                >
                    <Plus />
                    Add Visitor
                </button>
            </div>
            <div>
                <Table
                    className="border text-gray-200 rounded-md"
                    dataSource={pdlToVisitDataSource}
                    columns={visitorToPdlRelationshipColumns}
                    scroll={{ x: 800 }}
                />

            </div>

            <Modal
                centered
                className="overflow-y-auto rounded-lg scrollbar-hide"
                title={editIndex !== null ? "Edit Visitor" : "Add Visitor"}
                open={isModalOpen}
                onCancel={handleModalClose}
                footer={null}
                width="40%"
            >
                <PDLVisitorForm
                    pdlVisitors={pdlVisitors}
                    pdlVisitorsLoading={visitorsLoading}
                    visitorSearch={visitorSearch}
                    setVisitorSearch={setVisitorSearch}
                    visitorPage={visitorPage}
                    setVisitorPage={setVisitorPage}
                    pdlVisitorsCount={pdlVisitorsCount}
                    editPdlToVisitIndex={editIndex}
                    setEditPdlToVisitIndex={setEditIndex}
                    handlePdlToVisitModalCancel={handleModalClose}
                    pdlForm={pdlForm}
                    pdlVisitorTableInfo={pdlVisitorTableInfo}
                    setPdlForm={setPdlForm}
                    setPdlVisitorTableInfo={setPdlVisitorTableInfo}
                    visitorToPdlRelationship={visitorToPdlRelationship?.results || []}
                    visitorToPdlRelationshipLoading={visitorToPdlRelationshipLoading}
                />
            </Modal>
        </div>
    )
}

export default PdlVisitor