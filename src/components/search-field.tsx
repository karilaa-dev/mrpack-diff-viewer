import { useId } from "react"
import { SearchIcon, XIcon } from "lucide-react"

import { Field, FieldLabel } from "@/components/ui/field"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupInput,
} from "@/components/ui/input-group"

interface SearchFieldProps {
  label: string
  placeholder: string
  value: string
  onChange: (value: string) => void
}

export function SearchField({
  label,
  placeholder,
  value,
  onChange,
}: SearchFieldProps) {
  const id = useId()

  return (
    <Field className="max-w-xl">
      <FieldLabel htmlFor={id} className="sr-only">
        {label}
      </FieldLabel>
      <InputGroup>
        <InputGroupAddon>
          <SearchIcon aria-hidden="true" />
        </InputGroupAddon>
        <InputGroupInput
          id={id}
          type="search"
          placeholder={placeholder}
          value={value}
          onChange={(event) => onChange(event.target.value)}
        />
        {value ? (
          <InputGroupAddon align="inline-end">
            <InputGroupButton
              size="icon-xs"
              onClick={() => onChange("")}
              aria-label={`Clear ${label.toLowerCase()}`}
            >
              <XIcon data-icon="inline-start" />
            </InputGroupButton>
          </InputGroupAddon>
        ) : null}
      </InputGroup>
    </Field>
  )
}
