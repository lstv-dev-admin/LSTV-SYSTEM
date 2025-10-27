import { DynamicCRUD } from "@/components/DynamicCRUD";

const Award = () => {
  return (
    <DynamicCRUD
      tableName="award"
      title="Award"
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

export default Award;