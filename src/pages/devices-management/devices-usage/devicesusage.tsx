import { getDevice_Usage, deleteDevice_Usage, getUser } from "@/lib/queries";
import { useTokenStore } from "@/store/useTokenStore";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { CSVLink } from "react-csv";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import * as XLSX from "xlsx";
import { Table, Button, message, Modal, Dropdown, Menu } from "antd";
import { AiOutlineDelete, AiOutlineEdit } from "react-icons/ai";
import { ColumnsType } from "antd/es/table";
import { useState } from "react";
import { GoDownload, GoPlus } from "react-icons/go";
import AddDeviceUsage from "./AddDevicesUsage";
import EditDevicesUsage from "./EditDeviceUsage";
import { LuSearch } from "react-icons/lu";
import bjmp from '../../../assets/Logo/QCJMD.png'

type DeviceUsage = {
  key: number;
  id: number;
  usage: string;
  description: string;
};

const DeviceUsage = () => {
    const [searchText, setSearchText] = useState("");
    const token = useTokenStore().token;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const queryClient = useQueryClient();
    const [messageApi, contextHolder] = message.useMessage();
    const [isEditModalOpen, setIsEditModalOpen] = useState(false);
    const [deviceUsage, setDeviceUsage] = useState<DeviceUsage | null>(null);
    const [pdfDataUrl, setPdfDataUrl] = useState(null);
    const [isPdfModalOpen, setIsPdfModalOpen] = useState(false);
    const [pagination, setPagination] = useState({ current: 1, pageSize: 10 });

    const { data } = useQuery({
        queryKey: ["device-usage"],
        queryFn: () => getDevice_Usage(token ?? ""),
    });

    const { data: UserData } = useQuery({
        queryKey: ['user'],
        queryFn: () => getUser(token ?? "")
    })

    const deleteMutation = useMutation({
        mutationFn: (id: number) => deleteDevice_Usage(token ?? "", id),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: ["device-usage"] });
            messageApi.success("Device Usage deleted successfully");
        },
        onError: (error: any) => {
            messageApi.error(error.message || "Failed to delete Device Usage");
        },
    });

    const showModal = () => {
      setIsModalOpen(true);
    };
  
    const handleCancel = () => {
      setIsModalOpen(false);
    };

    const dataSource = data?.results?.map((device_usage, index) => ({
        key: device_usage?.id,
        id: device_usage?.id,
        usage: device_usage?.usage ?? "N/A",
        description: device_usage?.description ?? "N/A",
        organization: device_usage?.organization ?? 'Bureau of Jail Management and Penology',
        updated_by: `${UserData?.first_name ?? ''} ${UserData?.last_name ?? ''}`,
    })) || [];

    const filteredData = dataSource?.filter((deviceusage) =>
        Object.values(deviceusage).some((value) =>
            String(value).toLowerCase().includes(searchText.toLowerCase())
        )
    );

    const columns: ColumnsType<DeviceUsage> = [
        {
            title: "No.",
            render: (_, __, index) => (pagination.current - 1) * pagination.pageSize + index + 1,
        },
        {
            title: "Device Usage",
            dataIndex: "usage",
            key: "usage",
            sorter: (a, b) => a.usage.localeCompare(b.usage),
        },
        {
            title: "Description",
            dataIndex: "description", 
            key: "description",
            sorter: (a, b) => a.description.localeCompare(b.description),
        },
        {
            title: "Actions",
            key: "actions",
            render: (_: any, record: DeviceUsage) => (
                <div className="flex gap-1.5 font-semibold transition-all ease-in-out duration-200 justify-center">
                    <Button
                        type="link"
                        onClick={() => {
                            setDeviceUsage(record);
                            setIsEditModalOpen(true);
                        }}
                    >
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
    ];
    
    const handleExportExcel = () => {
        const ws = XLSX.utils.json_to_sheet(dataSource);
        const wb = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(wb, ws, "DeviceStatus");
        XLSX.writeFile(wb, "DeviceStatus.xlsx");
    };

    const handleExportPDF = () => {
        const doc = new jsPDF();
        const headerHeight = 48;
        const footerHeight = 32;
        const organizationName = dataSource[0]?.organization || ""; 
        const PreparedBy = dataSource[0]?.updated_by || ''; 
    
        const today = new Date();
        const formattedDate = today.toISOString().split('T')[0];
        const reportReferenceNo = `TAL-${formattedDate}-XXX`;
    
        const maxRowsPerPage = 29; 
    
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
            doc.text("Device Usage Report", 10, 15); 
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
            item.usage,
            item.description,
        ]);
    
        for (let i = 0; i < tableData.length; i += maxRowsPerPage) {
            const pageData = tableData.slice(i, i + maxRowsPerPage);
    
            autoTable(doc, { 
                head: [['No.', 'Device Usage', 'Description']],
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
                <CSVLink data={dataSource} filename="DeviceStatus.csv">
                    Export CSV
                </CSVLink>
            </Menu.Item>
        </Menu>
    );

    return (
        <div className="h-screen">
            {contextHolder}
            <h1 className="text-3xl font-bold text-[#1E365D]">Device Usage</h1>
            <div className="my-4 flex justify-between gap-2">
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
                    <div className="flex items-center gap-2">
                        <div className="flex-1 relative flex items-center">
                        <input
                            placeholder="Search"
                            type="text"
                            onChange={(e) => setSearchText(e.target.value)}
                            className="border border-gray-400 h-10 w-96 rounded-md px-2 active:outline-none focus:outline-none"
                        />
                        <LuSearch className="absolute right-[1%] text-gray-400" />
                    </div>
                    <button
                        className="bg-[#1E365D] text-white px-3 py-2 rounded-md flex gap-1 items-center justify-center"
                        onClick={showModal}
                    >
                        <GoPlus />
                        Add Device Usage
                    </button>
                    </div>
                    
                </div>
            <div className="w-full">
                <div id="printable-table">
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
                </div>
            </div>
            <Modal
                title="Device Usage Report"
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
              className="overflow-y-auto rounded-lg scrollbar-hide"
              title="Add Device Usage"
              open={isModalOpen}
              onCancel={handleCancel}
              footer={null}
              style={{  overflowY: "auto" }} 
            >
              <AddDeviceUsage onClose={handleCancel} />
            </Modal>
            <Modal
                title="Edit Device Usage"
                open={isEditModalOpen}
                onCancel={() => setIsEditModalOpen(false)}
                footer={null}
            >
                <EditDevicesUsage
                    deviceusage={deviceUsage}
                    onClose={() => setIsEditModalOpen(false)}
                />
            </Modal>
        </div>
    );
};

export default DeviceUsage;