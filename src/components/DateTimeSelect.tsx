import { Dispatch, SetStateAction, useState } from "react";

type Props = {
  selectedDateTime: string;
  setSelectedDateTime: Dispatch<SetStateAction<string>>;
};

function DateTimeSelect({ selectedDateTime, setSelectedDateTime }: Props) {
  const handleSetSelectedDateTime = (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    setSelectedDateTime(e.target.value);
    console.log(e.target.value);
  };
  const handleSetSelectedTime = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSelectedDateTime(e.target.value);
    console.log(e.target.value);
  };

  return (
    <div className="flex flex-row items-center justify-center gap-10 p-4">
      <label htmlFor="date-time-select">Travel time: </label>
      <input
        type="datetime-local"
        value={selectedDateTime}
        onChange={(e) => handleSetSelectedDateTime(e)}
        id="date-time-select"
      ></input>
    </div>
  );
}

export default DateTimeSelect;
