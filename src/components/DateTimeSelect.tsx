import { Dispatch, SetStateAction } from "react";

type Props = {
  selectedDateTime: string;
  setSelectedDateTime: Dispatch<SetStateAction<string>>;
};

function DateTimeSelect({ selectedDateTime, setSelectedDateTime }: Props) {
  const handleSetSelectedDateTime = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDateTime(e.target.value);
  };

  return (
    <div className="flex flex-col items-center justify-center gap-4 p-4">
      <label htmlFor="date-time-select">When are you traveling? </label>
      <input
        type="datetime-local"
        value={selectedDateTime}
        onChange={(e) => handleSetSelectedDateTime(e)}
        id="date-time-select"
        className="w-full rounded-b-lg rounded-t-lg border border-gray-300 bg-gray-50 p-2.5 text-sm text-gray-900 focus:border-blue-500 
         focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white dark:placeholder-gray-400 dark:focus:border-blue-500 dark:focus:ring-blue-500"
      ></input>
    </div>
  );
}

export default DateTimeSelect;
