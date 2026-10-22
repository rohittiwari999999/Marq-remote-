import fs from 'fs';
import path from 'path';

const manifestPath = path.resolve('android/app/src/main/AndroidManifest.xml');
const javaDirPath = path.resolve('android/app/src/main/java/com/marq/acremote');
const pluginPath = path.join(javaDirPath, 'ConsumerIrPlugin.java');
const mainActivityPath = path.join(javaDirPath, 'MainActivity.java');

console.log('--- Setting up Native Android ConsumerIr for MarQ AC Remote ---');

// 1. Add permissions to AndroidManifest.xml
if (fs.existsSync(manifestPath)) {
  let manifest = fs.readFileSync(manifestPath, 'utf8');
  if (!manifest.includes('android.permission.TRANSMIT_IR')) {
    const permString = `
    <uses-permission android:name="android.permission.TRANSMIT_IR" />
    <uses-feature android:name="android.hardware.ConsumerIr" android:required="false" />
    <uses-permission android:name="android.permission.VIBRATE" />
`;
    manifest = manifest.replace('<application', `${permString}\n    <application`);
    fs.writeFileSync(manifestPath, manifest, 'utf8');
    console.log('✓ Injected TRANSMIT_IR and VIBRATE permissions into AndroidManifest.xml');
  } else {
    console.log('✓ AndroidManifest.xml already has TRANSMIT_IR permission');
  }
} else {
  console.log('⚠ AndroidManifest.xml not found yet, will be configured during cap add android.');
}

// 2. Create ConsumerIrPlugin.java
if (!fs.existsSync(javaDirPath)) {
  fs.mkdirSync(javaDirPath, { recursive: true });
}

const pluginCode = `package com.marq.acremote;

import android.content.Context;
import android.hardware.ConsumerIrManager;
import com.getcapacitor.JSArray;
import com.getcapacitor.JSObject;
import com.getcapacitor.Plugin;
import com.getcapacitor.PluginCall;
import com.getcapacitor.PluginMethod;
import com.getcapacitor.annotation.CapacitorPlugin;
import org.json.JSONException;

@CapacitorPlugin(name = "ConsumerIrPlugin")
public class ConsumerIrPlugin extends Plugin {

    @PluginMethod
    public void hasIrEmitter(PluginCall call) {
        ConsumerIrManager irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
        boolean hasIr = irManager != null && irManager.hasIrEmitter();
        JSObject ret = new JSObject();
        ret.put("hasIr", hasIr);
        call.resolve(ret);
    }

    @PluginMethod
    public void transmit(PluginCall call) {
        ConsumerIrManager irManager = (ConsumerIrManager) getContext().getSystemService(Context.CONSUMER_IR_SERVICE);
        if (irManager == null || !irManager.hasIrEmitter()) {
            call.reject("Device does not possess an infrared emitter hardware");
            return;
        }

        int frequency = call.getInt("frequency", 38000);
        JSArray patternArray = call.getArray("pattern");
        if (patternArray == null || patternArray.length() == 0) {
            call.reject("Invalid pulse pattern");
            return;
        }

        try {
            int[] pattern = new int[patternArray.length()];
            for (int i = 0; i < patternArray.length(); i++) {
                pattern[i] = patternArray.getInt(i);
            }
            irManager.transmit(frequency, pattern);
            JSObject ret = new JSObject();
            ret.put("success", true);
            ret.put("message", "Fired " + pattern.length + " IR pulses at " + frequency + "Hz");
            call.resolve(ret);
        } catch (JSONException e) {
            call.reject("Error parsing IR pattern: " + e.getMessage());
        }
    }
}
`;

fs.writeFileSync(pluginPath, pluginCode, 'utf8');
console.log('✓ Created ConsumerIrPlugin.java with native ConsumerIrManager support');

// 3. Update MainActivity.java to register plugin
const mainActivityCode = `package com.marq.acremote;

import android.os.Bundle;
import com.getcapacitor.BridgeActivity;

public class MainActivity extends BridgeActivity {
    @Override
    public void onCreate(Bundle savedInstanceState) {
        registerPlugin(ConsumerIrPlugin.class);
        super.onCreate(savedInstanceState);
    }
}
`;

fs.writeFileSync(mainActivityPath, mainActivityCode, 'utf8');
console.log('✓ Registered ConsumerIrPlugin in MainActivity.java');
console.log('--- Native ConsumerIR Setup Complete ---');
