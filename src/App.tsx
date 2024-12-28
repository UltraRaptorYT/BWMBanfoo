import "./App.css";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import { useEffect, useState } from "react";
import * as XLSX from "xlsx";
// import { Button } from "@/components/ui/button";

function App() {
  const [data, setData] = useState<object[]>([]); // Define data type as an array of objects

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]; // Optional chaining in case no file is selected

    if (!file) {
      alert("No file selected");
      return;
    }

    const fileType = file.name.split(".").pop()?.toLowerCase(); // Ensure the extension is lowercase

    if (fileType === "csv") {
      Papa.parse(file, {
        header: true,
        skipEmptyLines: true,
        complete: (results) => {
          setData(results.data as object[]); // Explicitly type-cast the result as an array of objects
        },
      });
    } else if (fileType === "xlsx" || fileType === "xls") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const binaryStr = e.target?.result as string; // Ensure the result is treated as a string
        const workbook = XLSX.read(binaryStr, { type: "binary" });
        const sheetName = workbook.SheetNames[0];
        const sheetData = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
        setData(sheetData as object[]);
      };
      reader.readAsBinaryString(file);
    } else {
      alert("Unsupported file format. Please upload a CSV or XLSX file.");
    }
  };

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  return (
    <div>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="file-upload">CSV/XLSX Namelist</Label>
        <Input
          id="file-upload"
          type="file"
          accept=".csv, .xlsx, .xls"
          onChange={handleFileUpload}
        />
      </div>
    </div>
  );
}

export default App;
