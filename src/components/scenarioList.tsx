import React, { useState, useMemo } from "react";
import {
  Container,
  Text,
  Input,
  Select,
  VStack,
  HStack,
} from "@react-three/uikit";
import { useScenarioStore } from "../stores/scenarioStore";

export const ScenarioList: React.FC = () => {
  const { scenarios } = useScenarioStore();
  const [searchTerm, setSearchTerm] = useState("");
  const [sortBy, setSortBy] = useState<"name" | "type">("name");
  const [filterType, setFilterType] = useState<string>("all");

  const scenarioTypes = useMemo(() => {
    const types = [...new Set(scenarios.map((scenario) => scenario.type))];
    return ["all", ...types];
  }, [scenarios]);

  const filteredAndSortedScenarios = useMemo(() => {
    let filtered = scenarios.filter(
      (scenario) =>
        scenario.name.toLowerCase().includes(searchTerm.toLowerCase()) &&
        (filterType === "all" || scenario.type === filterType)
    );

    return filtered.sort((a, b) => {
      if (sortBy === "name") {
        return a.name.localeCompare(b.name);
      }
      return a.type.localeCompare(b.type);
    });
  }, [scenarios, searchTerm, sortBy, filterType]);

  return (
    <Container padding={20} gap={10}>
      <Text fontSize={24} fontWeight="bold">
        Scenarios
      </Text>

      <HStack gap={10}>
        <Input
          placeholder="Search scenarios..."
          value={searchTerm}
          onValueChange={setSearchTerm}
          width={200}
        />

        <Select
          value={sortBy}
          onValueChange={(value) => setSortBy(value as "name" | "type")}
          width={120}
        >
          <option value="name">Sort by Name</option>
          <option value="type">Sort by Type</option>
        </Select>

        <Select value={filterType} onValueChange={setFilterType} width={120}>
          {scenarioTypes.map((type) => (
            <option key={type} value={type}>
              {type === "all" ? "All Types" : type}
            </option>
          ))}
        </Select>
      </HStack>

      <VStack gap={5} width="100%">
        {filteredAndSortedScenarios.map((scenario) => (
          <Container
            key={scenario.id}
            padding={10}
            backgroundColor="#f0f0f0"
            borderRadius={5}
            width="100%"
          >
            <HStack justifyContent="space-between">
              <VStack gap={2}>
                <Text fontSize={16} fontWeight="bold">
                  {scenario.name}
                </Text>
                <Text fontSize={12} color="#666">
                  {scenario.description}
                </Text>
              </VStack>
              <Text fontSize={14} color="#888">
                {scenario.type}
              </Text>
            </HStack>
          </Container>
        ))}
      </VStack>
    </Container>
  );
};
