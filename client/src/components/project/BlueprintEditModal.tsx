import { useState } from "react";
import {
  Button,
  Input,
  Select,
  SelectItem,
  Modal,
  ModalContent,
  ModalHeader,
  ModalBody,
  ModalFooter,
} from "@heroui/react";
import { toast } from "sonner";
import { api } from "@/utils/api";
import { CityPlanData } from "@/types/CityPlanTypes";

interface BlueprintEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  project: any;
  cityPlanData: CityPlanData;
  onCityPlanUpdate: (data: CityPlanData) => void;
}

interface BlueprintForm {
  width: number;
  height: number;
  unit: "meters" | "feet" | "kilometers";
}

export default function BlueprintEditModal({
  isOpen,
  onClose,
  project,
  cityPlanData,
  onCityPlanUpdate,
}: BlueprintEditModalProps) {
  const [blueprintForm, setBlueprintForm] = useState<BlueprintForm>({
    width: project.blueprint_width || 100,
    height: project.blueprint_height || 100,
    unit: project.blueprint_unit || "meters",
  });

  const updateBlueprintDimensions = async () => {
    try {
      const response: any = await api.put(
        `/api/projects/${project.id}/blueprint`,
        blueprintForm
      );
      console.log("Blueprint update response:", response); // Debug log

      if (response.success) {
        toast.success("Blueprint dimensions updated successfully");

        // Update the city plan data with new blueprint (bottom-left origin)
        const updatedCityPlan = {
          ...cityPlanData,
          blueprint: blueprintForm,
          bounds: {
            minX: 0,
            maxX: blueprintForm.width,
            minY: 0,
            maxY: blueprintForm.height,
          },
        };
        onCityPlanUpdate(updatedCityPlan);
        onClose();
      } else {
        // Handle case where API call succeeds but success is false
        toast.error(
          response.message || "Failed to update blueprint dimensions"
        );
      }
    } catch (error) {
      console.error("Error updating blueprint:", error);
      toast.error("Failed to update blueprint dimensions");
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose}>
      <ModalContent>
        {(onClose) => (
          <>
            <ModalHeader className="flex flex-col gap-1">
              Edit Blueprint Dimensions
            </ModalHeader>
            <ModalBody>
              <div className="space-y-4">
                <Input
                  type="number"
                  label="Width"
                  value={blueprintForm.width.toString()}
                  onChange={(e) =>
                    setBlueprintForm((prev) => ({
                      ...prev,
                      width: Number(e.target.value),
                    }))
                  }
                  endContent={
                    <span className="text-small text-default-400">
                      {blueprintForm.unit}
                    </span>
                  }
                />
                <Input
                  type="number"
                  label="Height"
                  value={blueprintForm.height.toString()}
                  onChange={(e) =>
                    setBlueprintForm((prev) => ({
                      ...prev,
                      height: Number(e.target.value),
                    }))
                  }
                  endContent={
                    <span className="text-small text-default-400">
                      {blueprintForm.unit}
                    </span>
                  }
                />
                <Select
                  label="Unit"
                  selectedKeys={[blueprintForm.unit]}
                  onSelectionChange={(keys) =>
                    setBlueprintForm((prev) => ({
                      ...prev,
                      unit: Array.from(keys)[0] as
                        | "meters"
                        | "feet"
                        | "kilometers",
                    }))
                  }
                >
                  <SelectItem key="meters">Meters</SelectItem>
                  <SelectItem key="feet">Feet</SelectItem>
                  <SelectItem key="kilometers">Kilometers</SelectItem>
                </Select>
              </div>
            </ModalBody>
            <ModalFooter>
              <Button color="danger" variant="light" onPress={onClose}>
                Cancel
              </Button>
              <Button color="primary" onPress={updateBlueprintDimensions}>
                Update
              </Button>
            </ModalFooter>
          </>
        )}
      </ModalContent>
    </Modal>
  );
}
