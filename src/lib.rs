use wasm_bindgen::prelude::*;
use sbp2csv::runner::{MsgOptions, Runner};
use sbp::messages::{SBP};

extern crate console_error_panic_hook;

use serde::{Serialize, Deserialize};

#[derive(Serialize, Deserialize)]
pub struct SbpData {
    pub tow: Vec<f64>,
    pub sog: Vec<f64>,
    pub lats: Vec<f64>,
    pub lons: Vec<f64>,
    pub sat_trackeds: Vec<u8>, 
    pub sat_useds: Vec<u8>,
    pub cogs: Vec<f64>,
}


#[wasm_bindgen]
extern "C" {
    fn alert(s: &str);
    // Use `js_namespace` here to bind `console.log(..)` instead of just
    // `log(..)`
    #[wasm_bindgen(js_namespace = console)]
    fn log(s: &str);

    // The `console.log` is quite polymorphic, so we can bind it with multiple
    // signatures. Note that we need to use `js_name` to ensure we always call
    // `log` in JS.
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_u32(a: u32);

    // Multiple arguments too!
    #[wasm_bindgen(js_namespace = console, js_name = log)]
    fn log_many(a: &str, b: &str);
}

fn log_errors(messages: impl Iterator<Item = sbp::Result<SBP>>) -> impl Iterator<Item = SBP> {
    messages
        .inspect(|msg| {
            if let Err(e) = msg {
                eprintln!("error reading message: {}", e);
            }
        })
        .filter_map(sbp::Result::ok)
}

#[wasm_bindgen]
pub fn handle_sbp_file_data(sbp_file_data: &[u8]) -> JsValue {
    console_error_panic_hook::set_once();    
    let messages = sbp::iter_messages(sbp_file_data);
    let messages = log_errors(messages);
    let options = MsgOptions {
        use_gnss_only: false,
        use_obs_for_trk: false,
        ignore_gnss_pos: false,
        ignore_ins_pos: false,
    };

    let mut runner = Runner::new(messages, options);

    let mut tows = Vec::new();
    let mut sogs = Vec::new();
    let mut lats = Vec::new();
    let mut lons = Vec::new();
    let mut sat_trackeds = Vec::new();
    let mut sat_useds = Vec::new();
    let mut cogs = Vec::new();

    for (ds, _) in &mut runner {
        if let Some(ref ds) = ds {
            match ds.gps_tow_secs {
                None => {},
                Some(week_num) => {
                    tows.push(week_num);
                }
            }
            match ds.sog_mps {
                None => {},
                Some(sog) => {
                    sogs.push(sog);
                }
            }
            match ds.lat_deg {
                None => {},
                Some(lat) => {
                    lats.push(lat);
                }
            }
            match ds.lon_deg {
                None => {},
                Some(lon) => {
                    lons.push(lon);
                }
            }
            match ds.satellites_tracked {
                None => {},
                Some(sat) => {
                    sat_trackeds.push(sat);
                }
            }
            match ds.satellites_used {
                None => {},
                Some(sat) => {
                    sat_useds.push(sat);
                }
            }
            match ds.cog_deg {
                None => {},
                Some(cog) => {
                    cogs.push(cog);
                }
            }
        }
    }

    let data = SbpData {
        tow: tows,
        sog: sogs,
        lats: lats,
        lons: lons,
        sat_trackeds: sat_trackeds,
        sat_useds: sat_useds,
        cogs: cogs,
    };

    JsValue::from_serde(&data).unwrap()
}
