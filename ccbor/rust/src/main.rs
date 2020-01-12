/// `decode cbor` or `encode json`
fn main() {
	let args: Vec<String> = std::env::args().collect();
	let action = &args[1];
	if action == "decode" {
		let payload: Vec<u8> = serde_json::from_str(&args[2]).unwrap();
		let cbor_value = serde_cbor::from_slice(&payload).unwrap();
		let json_value: serde_json::Value = serde_json::from_value(cbor_value).unwrap();
		println!("{}", serde_json::to_string(&json_value).unwrap())
	} else {
		let payload = serde_json::from_str(&args[2]).unwrap();
		let cbor_value: serde_cbor::Value = serde_cbor::value::from_value(payload).unwrap();
		println!("{}", serde_json::to_string(&serde_cbor::to_vec(&cbor_value).unwrap()).unwrap())
	}
}
