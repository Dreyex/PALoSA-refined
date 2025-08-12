import IconCheckbox from "./IconCheckbox";

export default function CheckboxOptionList({ options, value = [], onChange }) {
    const toggleOption = (option) => {
        let newChecked;
        if (value.includes(option)) {
            newChecked = value.filter((o) => o !== option);
        } else {
            newChecked = [...value, option];
        }
        onChange && onChange(newChecked);
    };

    return (
        <div className='flex flex-col items-center p-4 space-y-2'>
            {options.map((option) => (
                <IconCheckbox
                    key={option}
                    label={option}
                    checked={value.includes(option)}
                    onChange={() => toggleOption(option)}
                />
            ))}
        </div>
    );
}
