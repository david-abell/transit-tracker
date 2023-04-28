import { Dispatch, SetStateAction } from "react";

type Props = {
  searchQuery: string;
  setSearchQuery: Dispatch<SetStateAction<string>>;
};
function SearchInput({ searchQuery, setSearchQuery }: Props) {
  return (
    <input
      type={"search"}
      value={searchQuery}
      onChange={({ currentTarget }) => setSearchQuery(currentTarget.value)}
    />
  );
}

export default SearchInput;
