import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Papa from "papaparse";
import React, { useEffect } from "react";
import * as XLSX from "xlsx";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { cn, useLocalStorageState } from "@/lib/utils";
import { Button } from "@/components/ui/button";

function App() {
  const [data, setData] = useLocalStorageState<{ [key: string]: any }[]>(
    "data",
    []
  ); // Define data type as an array of objects
  const [hideAdmin, setHideAdmin] = useLocalStorageState("hideAdmin", "false");
  const [col, setCol] = useLocalStorageState<string>("col", "");
  const [eventName, setEventName] = useLocalStorageState<string>(
    "eventName",
    ""
  );
  const [attendance, setAttendance] = useLocalStorageState<
    { [key: string]: any }[]
  >("attendance", []);
  const [notRegistered, setNotRegistered] = useLocalStorageState<string[]>(
    "notRegistered",
    []
  );

  const handleKeyDown = (event: React.KeyboardEvent<HTMLDivElement>) => {
    console.log(event.key);
    if (event.key === "`") {
      setHideAdmin((prev) => String(!(prev == "true")));
    }
  };

  const handleFileUpload = (
    event: React.ChangeEvent<HTMLInputElement>
  ): void => {
    const file = event.target.files?.[0]; // Optional chaining in case no file is selected
    if (!file) {
      toast.error("No file selected");
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
      toast.error("Unsupported file format. Please upload a CSV or XLSX file.");
    }
  };

  function handleIDInput(e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key == "Enter" && col && data) {
      let studID = (e.target as HTMLInputElement).value;
      let filteredData = data.filter((e) => {
        return e[col] == studID;
      });
      let alrScanned = attendance.filter((e) => {
        return e[col] == studID;
      });
      if (alrScanned.length > 0) {
        toast.warning(`${studID} already scanned!`);
      } else if (filteredData.length > 0) {
        setAttendance((prev) => [...prev, filteredData[0]]);
        toast.success(`${studID} successfully registered!`);
      } else {
        if (!notRegistered.includes(studID)) {
          setNotRegistered((prev) => [...prev, studID]);
        }
        toast.error(`${studID} not registered!`);
      }

      (e.target as HTMLInputElement).value = "";
    }
  }

  function exportData() {
    const attendanceSheet = XLSX.utils.json_to_sheet(attendance);
    const notInAttendance = data.filter(
      (person) => !attendance.some((attendee) => attendee[col] === person[col])
    );
    const noAttendanceSheet = XLSX.utils.json_to_sheet(notInAttendance);
    const notRegisteredSheet = XLSX.utils.json_to_sheet(
      notRegistered.map((e): { [key: string]: any } => {
        const empty: { [key: string]: any } = {};
        empty[col] = e;
        return empty;
      })
    );

    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, attendanceSheet, "Attendance");
    XLSX.utils.book_append_sheet(workbook, noAttendanceSheet, "Did Not Attend");
    XLSX.utils.book_append_sheet(
      workbook,
      notRegisteredSheet,
      "Not Registered"
    );

    XLSX.writeFile(workbook, `${eventName}_${new Date().toUTCString()}.xlsx`);
  }

  function clearData() {
    setData([]);
    setCol("");
    setEventName("");
    setAttendance([]);
    setNotRegistered([]);
  }

  useEffect(() => {
    if (data) {
      console.log(data);
    }
  }, [data]);

  return (
    <div
      className="flex flex-col gap-6 p-8 container mx-auto items-center justify-center fullHeight"
      onKeyDown={handleKeyDown}
      tabIndex={0}
    >
      <h1 className="text-3xl font-bold text-center">BWM Banfoo</h1>
      {hideAdmin == "false" && (
        <>
          <div className="flex flex-col gap-2">
            <p>Step 1: Upload CSV/XLSX Name list File [Requires HEADERS]</p>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="file-upload">CSV/XLSX Name list</Label>
              <Input
                type="file"
                accept=".csv, .xlsx, .xls"
                onChange={handleFileUpload}
              />
            </div>
          </div>
          <div className="flex flex-col gap-2">
            <p>Step 2: Select column which represents Student ID</p>
            <Select
              disabled={data.length == 0}
              value={col}
              onValueChange={setCol}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select Student ID column" />
              </SelectTrigger>
              <SelectContent>
                {Object.keys(data[0] || {}).map((e, i) => {
                  return (
                    <SelectItem key={i + e} value={e}>
                      {e}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <div className="flex flex-col gap-2">
            <p>Step 3: Enter Event Name</p>
            <div className="grid w-full max-w-sm items-center gap-1.5">
              <Label htmlFor="eventName">Event Name</Label>
              <Input
                id="eventName"
                type="text"
                disabled={col == ""}
                className="w-96"
                placeholder="Enter Event Name"
                value={eventName}
                onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
                  return setEventName(e.target.value);
                }}
              />
            </div>
          </div>

          <Button
            onClick={() => setHideAdmin("true")}
            disabled={data.length == 0 || col == "" || eventName == ""}
          >
            Start
          </Button>
        </>
      )}
      <h1 className={cn(hideAdmin == "true" ? "" : "hidden", "text-2xl")}>
        {eventName} Attendance
      </h1>
      <div className="grid w-full max-w-sm items-center gap-1.5">
        <Label htmlFor="studID">Student ID</Label>
        <Input
          id="studID"
          type="text"
          disabled={hideAdmin != "true"}
          onKeyDown={handleIDInput}
          className="w-96"
          placeholder="Enter Student ID"
        />
      </div>
      <div className={cn("flex gap-5", hideAdmin == "true" ? "hidden" : "")}>
        <Button
          onClick={() => exportData()}
          disabled={data.length == 0 || col == "" || eventName == ""}
        >
          Export Attendance
        </Button>
        <Button
          variant={"destructive"}
          onClick={() => clearData()}
          disabled={data.length == 0 || col == "" || eventName == ""}
        >
          Clear Data
        </Button>
      </div>
      <p className="text-sm text-gray-500">Click "`" to show configuration</p>
    </div>
  );
}

export default App;
