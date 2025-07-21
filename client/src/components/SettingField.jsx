import FileUploadInput from "./ui/FileUploadInput";
import TextPatternInput from "./ui/TextPatternInput";
import CheckboxOptionList from "./ui/CheckboxOptionList";

function SettingField({
    showFileInput = false,
    showTextInput = false,
    options,
    headline,
    comment = "",
    fileUploadType
}) {
    return (
        <div className='bg-steel-950 w-1/5 rounded-md p-4 shadow-glow'>
            <h1 className='text-center p-4 text-2xl opacity-80 font-extrabold'>
                {headline}
            </h1>
            <p className='mb-6 text-center text-sm opacity-80'>{comment}</p>
            {showFileInput && <FileUploadInput headline={'Config auswählen'} comment={'JSON'} buttonType={fileUploadType}/>}
            {showTextInput && <TextPatternInput />}
            {options && Array.isArray(options) && options.length > 0 && (
                <CheckboxOptionList options={options} />
            )}
        </div>
    );
}

export default SettingField;
