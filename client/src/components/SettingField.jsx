import FileUploadInput from "./ui/FileUploadInput";
import TextPatternInput from "./ui/TextPatternInput";
import CheckboxOptionList from "./ui/CheckboxOptionList";

function SettingField({
    id,
    showFileInput = false,
    showTextInput = false,
    options,
    headline,
    comment = "false",
    fileUploadType,
    value,
    onChange,
}) {
    const handleCheckboxChange = (updateCheckedOptions) => {
        onChange && onChange(id, { checkedOptions: updateCheckedOptions });
    };

    return (
        <div
            id={id}
            className='bg-steel-950 rounded-md p-4 shadow-glow 2xl:max-w-[400px] max-w-[675px] min-w-[366px]'
        >
            <h1 className='text-center p-4 text-2xl opacity-80 font-extrabold'>
                {headline}
            </h1>
            <p
                className={`mb-6 text-center text-sm cursor-default ${
                    comment === "false" ? "opacity-0" : "opacity-80"
                }`}
            >
                {comment}
            </p>
            {showTextInput && (
                <TextPatternInput
                    value={value?.patterns ?? []}
                    onChange={(newPatterns) =>
                        onChange && onChange(id, { patterns: newPatterns })
                    }
                />
            )}
            {showFileInput && (
                <FileUploadInput
                    headline={"Config auswählen"}
                    comment={"JSON"}
                    buttonType={fileUploadType}
                />
            )}
            {options && Array.isArray(options) && options.length > 0 && (
                <CheckboxOptionList
                    options={options}
                    value={value?.checkedOptions}
                    onChange={handleCheckboxChange}
                />
            )}
        </div>
    );
}

export default SettingField;
