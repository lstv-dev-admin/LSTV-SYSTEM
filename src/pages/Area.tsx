import { DynamicCrud } from "@/components/DynamicCRUD";

const Area = () => {
  return (
    <DynamicCrud
      tableName="area"
      title="Area"
      columns={[
        { key: "id", label: "ID", editable: false },
        { key: "name", label: "Name", editable: true },
        { key: "created_at", label: "Created At", editable: false },
        { key: "updated_at", label: "Updated At", editable: false },
      ]}
      itemsPerPage={10}
    />
  );
};

export default Area;