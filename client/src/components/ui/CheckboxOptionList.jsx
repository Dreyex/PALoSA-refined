import IconCheckbox from "./IconCheckbox";

export default function CheckboxOptionList({ options }) {
    return (
        <div className='flex flex-col justify-center items-start p-4'>
            {options.map((option, idx) => (
                <IconCheckbox key={idx} label={option} />
            ))}
        </div>
    );
}
