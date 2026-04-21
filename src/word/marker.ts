/**
 * Sleutel die we gebruiken om onze eigen highlights te onderscheiden van
 * user-formatting. Momenteel geen actief content-control — `clearHighlights`
 * reset simpelweg alle bekende tag-ranges door te herparsen. Mocht later
 * blijken dat we zeker willen weten of WIJ iets gekleurd hebben, dan
 * kunnen we hier een `ContentControl`-wrapper activeren met deze tag.
 */
export const MARKER = "doccrea-highlight";
