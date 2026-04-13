import { useMemo, useState } from "react";

function useLedgerFilters(rows, pageSize = 3) {
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [sortDirection, setSortDirection] = useState("desc");
  const [pageIndex, setPageIndex] = useState(0);

  const filteredRows = useMemo(() => {
    const scoped = currencyFilter === "ALL" ? rows : rows.filter((row) => row.currency === currencyFilter);
    return [...scoped].sort((a, b) => (sortDirection === "desc" ? b.postedAt.localeCompare(a.postedAt) : a.postedAt.localeCompare(b.postedAt)));
  }, [currencyFilter, rows, sortDirection]);

  const maxPage = Math.max(Math.ceil(filteredRows.length / pageSize) - 1, 0);
  const paginatedRows = filteredRows.slice(pageIndex * pageSize, pageIndex * pageSize + pageSize);

  return {
    currencyFilter,
    setCurrencyFilter,
    sortDirection,
    setSortDirection,
    pageIndex,
    setPageIndex,
    filteredRows,
    paginatedRows,
    maxPage,
  };
}

export default useLedgerFilters;
