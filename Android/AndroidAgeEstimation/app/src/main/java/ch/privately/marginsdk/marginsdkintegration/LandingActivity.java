package ch.privately.marginsdk.marginsdkintegration;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.os.Bundle;
import android.util.Log;
import android.view.View;

import androidx.cardview.widget.CardView;
import androidx.core.content.ContextCompat;

import ch.privately.core.PrivatelyCore;

public class LandingActivity extends Activity {
    private static final String TAG = "LandingActivity";
    private final String apiKey = "";
    private final String apiSecret = "";


    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_landing);

        CardView faceCard = findViewById(R.id.face_button);
        faceCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                if (isPermissionGranted(Manifest.permission.CAMERA)) {
                    startActivity(
                            new Intent(LandingActivity.this, ImageActivity.class));
                } else {
                    requestPermissions(new String[]{Manifest.permission.CAMERA}, 101);
                }
            }
        });

        CardView videoCard = findViewById(R.id.video_button);
        videoCard.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View v) {
                if (isPermissionGranted(Manifest.permission.CAMERA) &&
                        isPermissionGranted(Manifest.permission.RECORD_AUDIO)) {
                    startActivity(new Intent(LandingActivity.this, VideoActivity.class));
                } else {
                    requestPermissions(new String[]{Manifest.permission.CAMERA,
                            Manifest.permission.RECORD_AUDIO}, 102);
                }
            }
        });

        PrivatelyCore.INSTANCE.init(this);
        if (!PrivatelyCore.INSTANCE.isAuthenticated()) {
            PrivatelyCore.INSTANCE.authenticate(apiKey, apiSecret, new PrivatelyCore.AuthenticationCallback() {
                @Override
                public void onSuccess() {
                    Log.i(TAG, "Authenticated successfully");
                }

                @Override
                public void onError(String error) {
                    Log.e(TAG, "Error authenticating: " + error);
                }
            });
        }
    }

    private boolean isPermissionGranted(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        switch (requestCode) {
            case 101:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startActivity(new Intent(LandingActivity.this, ImageActivity.class));
                }
                break;
            case 102:
                if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                    startActivity(new Intent(LandingActivity.this, VideoActivity.class));
                }
                break;
            default:
                super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

}
