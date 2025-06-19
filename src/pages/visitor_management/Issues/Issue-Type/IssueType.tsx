
import { deleteIssue_Type, getIssueCategories, getIssueType, getRisks, getUser, patchIssue_Type } from "@/lib/queries";
import { useTokenStore } from "@/store/useTokenStore";
import { useMutation, useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Button, Dropdown, Form, Input, Menu, message, Modal, Select } from "antd";
import Table, { ColumnsType } from "antd/es/table";
import moment from "moment";
import { useState } from "react";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { GoDownload, GoPlus } from "react-icons/go";
import AddIssueType from "./AddIssueType";
import bjmp from '../../../../assets/Logo/QCJMD.png'

type IssueCategory = {
    id: number;
    name: string;
};

type IssueTypes = {
    id: number;
    updated_by: string;
    issue_category: IssueCategory;
    updated_at: string;
    categorization_rule: string; 
    risk: string;
    name: string;
    description: string;
    recommended_action: string[];
};

const IssueType = () => {
    const [searchText, setSearchText] = useState("");
    const token = useTokenStore().token;
    const [form] = Form.useForm();
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [selectIssueType, setSelctedIssueType] = useState<IssueTypes | null>(null);
    const [pdfDataUrl, setPdfDataUrl] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const { data } = useQuery({
        queryKey: ['issue-type'],
        queryFn: () => getIssueType(token ?? ""),
    })

    const { data: UserData } = useQuery({
        queryKey: ['user'],
        queryFn: () => getUser(token ?? "")
    })

    const showModal = () => {
        setIsModalOpen(true);
    };

    const handleCancel = () => {
        setIsModalOpen(false);
    };

    const deleteMutation = useMutation({
            mutationFn: (id: number) => deleteIssue_Type(token ?? "", id),
            onSuccess: () => {
                queryClient.invalidateQueries({ queryKey: ["issue-type"] });
                messageApi.success("Issue Type deleted successfully");
            },
            onError: (error: any) => {
                messageApi.error(error.message || "Failed to delete Issue Type");
            },
        });

    const { mutate: editIssueType, isLoading: isUpdating } = useMutation({
        mutationFn: (updated: IssueTypes) =>
        patchIssue_Type(token ?? "", updated.id, updated),
        onSuccess: () => {
        queryClient.invalidateQueries({ queryKey: ["issue-type"] });
        messageApi.success("Issue Type updated successfully");
        setIsEditModalOpen(false);
        },
        onError: () => {
        messageApi.error("Failed to update Issue Type");
        },
    });

    const results = useQueries({
        queries: [
            {
                queryKey: ["issue-category"],
                queryFn: () => getIssueCategories(token ?? ""),
            },
            {
                queryKey: ["risk"],
                queryFn: () => getRisks(token ?? ""),
            },
            ],
        });
        
    const IssueCategoryData = results[0].data;
    const RiskData = results[1].data;

    const handleEdit = (record: IssueTypes) => {
        setSelctedIssueType(record);
        form.setFieldsValue(record);
        setIsEditModalOpen(true);
    };

    const handleUpdate = (values: any) => {
        if (selectIssueType && selectIssueType.id) {
        const updatedRisk: IssueTypes = {
            ...selectIssueType,
            ...values,
        };
        editIssueType(updatedRisk);
        } else {
        messageApi.error("Selected Issue Type is invalid");
        }
    };

    const onIssueCategory = (value: number) => {
        setSelctedIssueType(prevForm => ({
            ...prevForm,
            issue_category_id: value,
        }));
    }; 

    const onRiskLevelChange = (value: number) => {
        setSelctedIssueType(prevForm => ({
            ...prevForm,
            risk_id: value,
        }));
    }; 

    const dataSource = data?.results?.map((issue_type, index) => (
        {
            key: index + 1,
            id: issue_type?.id ?? '',
            name: issue_type?.name ?? '',
            updated_at: issue_type?.updated_at ?? '',
            updated_by: issue_type?.updated_by ?? '',
            issue_category: issue_type?.issue_category?.name ?? '',
            categorization_rule: issue_type?.issue_category?.categorization_rule ?? '',
            issue_category_description: issue_type?.issue_category?.description ?? '',
            risk: issue_type?.risk?.name,
            recommended_action: issue_type?.risk?.recommended_action.map(recommended_action => recommended_action.name),
            organization: issue_type?.organization ?? 'Bureau of Jail Management and Penology',
            updated: `${UserData?.first_name ?? ''} ${UserData?.last_name ?? ''}`,
        }
    )) || [];

    const filteredData = dataSource?.filter((issue_type) =>
        Object.values(issue_type).some((value) =>
            String(value).toLowerCase().includes(searchText.toLowerCase())
        )
    );

    const columns: ColumnsType<IssueTypes> = [
        {
            title: 'No.',
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: 'Issue Type',
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => a.name.localeCompare(b.name),
        },
        // {
        //     title: 'Description',
        //     dataIndex: 'description',
        //     key: 'description',
        //     sorter: (a, b) => a.description.localeCompare(b.description),
        //     filters: [
        //         ...Array.from(
        //             new Set(filteredData.map(item => item.description))
        //         ).map(name => ({
        //             text: name,
        //             value: name,
        //         }))
        //     ],
        //     onFilter: (value, record) => record.description === value,
        // },
        {
            title: 'Issue Category',
            dataIndex: 'issue_category',
            key: 'issue_category',
            sorter: (a, b) => a.issue_category.localeCompare(b.issue_category),
        },
        {
            title: 'Issue Category Description',
            dataIndex: 'issue_category_description',
            key: 'issue_category_description',
            sorter: (a, b) => a.issue_category_description.localeCompare(b.issue_category_description),
        },
        {
            title: 'Categorization Rule',
            dataIndex: 'categorization_rule',
            key: 'categorization_rule',
            sorter: (a, b) => a.categorization_rule.localeCompare(b.categorization_rule),
        },
        // {
        //     title: 'Risk',
        //     dataIndex: 'risk',
        //     key: 'risk',
        // },
        {
            title: "Action",
            key: "action",
            fixed: 'right',
            render: (_, record) => (
                <div>
                    <Button type="link" onClick={() => handleEdit(record)}>
                        <AiOutlineEdit />
                    </Button>
                    <Button
                        type="link"
                        danger
                        onClick={() => deleteMutation.mutate(record.id)}
                        >
                        <AiOutlineDelete />
                    </Button>
                </div>
            ),
        },
    ]
    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(dataSource);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "IssueType");
        XLSX.writeFile(wb, "IssueType.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF('landscape');
        const headerHeight = 48;
        const footerHeight = 32;
        const organizationName = dataSource[0]?.organization || ""; 
        const PreparedBy = dataSource[0]?.updated || ''; 
    
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const reportReferenceNo = `TAL-${formattedDate}-XXX`;
    
        const maxRowsPerPage = 15; 
    
        let startY = headerHeight;
    
        const addHeader = () => {
            const pageWidth = doc.internal.pageSize.getWidth(); 
            const imageWidth = 30;
            const imageHeight = 30; 
            const margin = 10; 
            const imageX = pageWidth - imageWidth - margin;
            const imageY = 12;
        
            doc.addImage(bjmp, 'PNG', imageX, imageY, imageWidth, imageHeight);
        
            doc.setTextColor(0, 102, 204);
            doc.setFontSize(16);
            doc.text("Issue Type Report", 10, 15); 
            doc.setTextColor(0, 0, 0);
            doc.setFontSize(10);
            doc.text(`Organization Name: ${organizationName}`, 10, 25);
            doc.text("Report Date: " + formattedDate, 10, 30);
            doc.text("Prepared By: " + PreparedBy, 10, 35);
            doc.text("Department/ Unit: IT", 10, 40);
            doc.text("Report Reference No.: " + reportReferenceNo, 10, 45);
        };
        
    
        addHeader(); 
    
const isSearching = searchText.trim().length > 0;
    const tableData = (isSearching ? (filteredData || []) : (dataSource || [])).map((item, idx) => [
            idx + 1,
            item.name,
            item.issue_category,
        ]);
    
        for (let i = 0; i < tableData.length; i += maxRowsPerPage) {
            const pageData = tableData.slice(i, i + maxRowsPerPage);
    
            autoTable(doc, { 
                head: [['No.', 'Isue Type', 'Issue Category']],
                body: pageData,
                startY: startY,
                margin: { top: 0, left: 10, right: 10 },
                didDrawPage: function (data) {
                    if (doc.internal.getCurrentPageInfo().pageNumber > 1) {
                        addHeader(); 
                    }
                },
            });
    
            if (i + maxRowsPerPage < tableData.length) {
                doc.addPage();
                startY = headerHeight;
            }
        }
    
        const pageCount = doc.internal.getNumberOfPages();
        for (let page = 1; page <= pageCount; page++) {
            doc.setPage(page);
            const footerText = [
                "Document Version: Version 1.0",
                "Confidentiality Level: Internal use only",
                "Contact Info: " + PreparedBy,
                `Timestamp of Last Update: ${formattedDate}`
            ].join('\n');
            const footerX = 10;
            const footerY = doc.internal.pageSize.height - footerHeight + 15;
            const pageX = doc.internal.pageSize.width - doc.getTextWidth(`${page} / ${pageCount}`) - 10;
            doc.setFontSize(8);
            doc.text(footerText, footerX, footerY);
            doc.text(`${page} / ${pageCount}`, pageX, footerY);
        }
    
        const pdfOutput = doc.output('datauristring');
        setPdfDataUrl(pdfOutput);
        setIsPdfModalOpen(true);
    };

    const handleClosePdfModal = () => {
        setIsPdfModalOpen(false);
        setPdfDataUrl(null); 
    };
    const menu = (
        <Menu>
            <Menu.Item>
                <a onClick={handleExportExcel}>Export Excel</a>
            </Menu.Item>
            <Menu.Item>
                <CSVLink data={dataSource} filename="IssueType.csv">
                    Export CSV
                </CSVLink>
            </Menu.Item>
        </Menu>
    );
    return (
        <div>
        {contextHolder}
        <h1 className="text-3xl font-bold text-[#1E365D]">Issue Type</h1>
        <div className="flex items-center justify-between my-4">
        <div className="flex gap-2">
                        <Dropdown className="bg-[#1E365D] py-2 px-5 rounded-md text-white" overlay={menu}>
                            <a className="ant-dropdown-link gap-2 flex items-center " onClick={e => e.preventDefault()}>
                                <GoDownload /> Export
                            </a>
                        </Dropdown>
                        <button className="bg-[#1E365D] py-2 px-5 rounded-md text-white" onClick={handleExportPDF}>
                            Print Report
                        </button>
                    </div>
            <div className="flex gap-2 items-center">
                <Input
                    placeholder="Search..."
                    value={searchText}
                    className="py-2 md:w-64 w-full"
                    onChange={(e) => setSearchText(e.target.value)}
                />
                <button
                    className="bg-[#1E365D] text-white px-3 py-2 rounded-md flex gap-1 items-center justify-center"
                    onClick={showModal}
                        >
                    <GoPlus />
                        Add Issue Type
                </button>
            </div>
        </div>
            <Table
                className="overflow-x-auto"
                columns={columns}
                dataSource={filteredData}
                scroll={{ x: 'max-content' }} 
                pagination={{
                    current: pagination.current,
                    pageSize: pagination.pageSize,
                    onChange: (page, pageSize) => setPagination({ current: page, pageSize }),
                }}
            />
            <Modal
                title="Issue Type Report"
                open={isPdfModalOpen}
                onCancel={handleClosePdfModal}
                footer={null}
                width="80%"
            >
                {pdfDataUrl && (
                    <iframe
                        src={pdfDataUrl}
                        title="PDF Preview"
                        style={{ width: '100%', height: '80vh', border: 'none' }}
                    />
                )}
            </Modal>
            <Modal
                title="Edit Issue Type"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                onOk={() => form.submit()}
                confirmLoading={isUpdating}
                width="50%"
            >
                <Form form={form} layout="vertical" onFinish={handleUpdate}>
                <Form.Item
                    name="name"
                    label="Issue Type Name"
                    rules={[{ required: true, message: "Please input the issue type name" }]}
                >
                    <Input />
                </Form.Item>
                <Form.Item
                    name="issue_category"
                    label="Issue Category"
                >
                    <Select
                        className="h-[3rem] w-full"
                        showSearch
                        placeholder="Issue Category"
                        optionFilterProp="label"
                        onChange={onIssueCategory}
                        options={IssueCategoryData?.results?.map(issue_category => (
                            {
                                value: issue_category.id,
                                label: issue_category?.name
                            }
                        ))}
                    />
                </Form.Item>
                <Form.Item
                    name="issue_category_description"
                    label="Issue Category Description"
                    rules={[{ required: true, message: "Please input a description" }]}
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                    name="categorization_rule"
                    label="Categorization Rule"
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
                <Form.Item
                    name="recommended_action"
                    label="Recommended Action"
                >
                    <Input.TextArea rows={3} />
                </Form.Item>
                    <Form.Item
                    name="risk"
                    label="Risk"
                >
                    <Select
                        className="h-[3rem] w-full"
                        showSearch
                        placeholder="Risk"
                        optionFilterProp="label"
                        onChange={onRiskLevelChange}
                        options={RiskData?.results?.map(risk => (
                            {
                                value: risk.id,
                                label: risk?.name
                            }
                        ))}
                    />
                </Form.Item>
                </Form>
            </Modal>
            <Modal
                className="overflow-y-auto rounded-lg scrollbar-hide"
                title="Add Issue Type"
                open={isModalOpen}
                onCancel={handleCancel}
                footer={null}
                width="40%"
                style={{ maxHeight: "80vh", overflowY: "auto" }} 
                >
                <AddIssueType onClose={handleCancel} />
            </Modal>
        </div>
    )
}

export default IssueType
