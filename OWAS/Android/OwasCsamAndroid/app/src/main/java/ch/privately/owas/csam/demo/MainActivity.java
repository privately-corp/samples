package ch.privately.owas.csam.demo;

import androidx.appcompat.app.AppCompatActivity;
import androidx.core.content.ContextCompat;

import android.Manifest;
import android.app.Activity;
import android.content.Intent;
import android.content.pm.PackageManager;
import android.graphics.Bitmap;
import android.net.Uri;
import android.os.Bundle;
import android.provider.MediaStore;
import android.util.Log;
import android.view.View;
import android.widget.Button;
import android.widget.ImageView;
import android.widget.TextView;

import java.io.IOException;
import java.security.InvalidKeyException;

import ch.privately.core.PrivatelyCore;
import ch.privately.owas.csam.CsamAnalyzer;

public class MainActivity extends AppCompatActivity {

    private static final int FILE_ACCESS_REQUEST_CODE = 1;
    private static final int IMAGE_SELECTION_REQUEST_CODE = 2;
    private final String apiKey = "";
    private final String apiSecret = "";

    private ImageView selectedImage;
    private TextView resultTextView;
    private Button selectImageButton;

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        setContentView(R.layout.activity_main);

        selectedImage = findViewById(R.id.selected_image);
        resultTextView = findViewById(R.id.result_text_view);

        selectImageButton = findViewById(R.id.select_image_button);

        PrivatelyCore.INSTANCE.init(this);
        if (!PrivatelyCore.INSTANCE.isAuthenticated()) {
            PrivatelyCore.INSTANCE.authenticate(apiKey, apiSecret,
                    new PrivatelyCore.AuthenticationCallback() {
                @Override
                public void onSuccess() {
                    try {
                        CsamAnalyzer.INSTANCE.init(MainActivity.this);
                    } catch (IOException | InvalidKeyException e) {
                        e.printStackTrace();
                    }
                }

                @Override
                public void onError(String error) {

                }
            });
        } else {
            try {
                CsamAnalyzer.INSTANCE.init(this);
            } catch(IOException |InvalidKeyException e) {

            }
        }

        selectImageButton.setOnClickListener(new View.OnClickListener() {
            @Override
            public void onClick(View view) {
                selectImageButton.setEnabled(false);
                selectImageButton.setClickable(false);
                resultTextView.setText("");

                if (isPermissionGranted(Manifest.permission.READ_EXTERNAL_STORAGE)) {
                    openFileBrowser(IMAGE_SELECTION_REQUEST_CODE);
                } else {
                    requestPermissions(new String[]{Manifest.permission.READ_EXTERNAL_STORAGE}, FILE_ACCESS_REQUEST_CODE);
                }
            }
        });
    }

    @Override
    public void onRequestPermissionsResult(int requestCode, String[] permissions, int[] grantResults) {
        if (requestCode == FILE_ACCESS_REQUEST_CODE) {
            if (grantResults[0] == PackageManager.PERMISSION_GRANTED) {
                openFileBrowser(IMAGE_SELECTION_REQUEST_CODE);
            }
        } else {
            super.onRequestPermissionsResult(requestCode, permissions, grantResults);
        }
    }

    public void onActivityResult(int requestCode, int resultCode, Intent data) {
        if (resultCode == Activity.RESULT_OK && requestCode == IMAGE_SELECTION_REQUEST_CODE) {
            Uri selectedImageUri = data.getData();
            try {
                Bitmap bitmap = MediaStore.Images.Media.getBitmap(this.getContentResolver(), selectedImageUri);
                selectedImage.setImageBitmap(bitmap);

                new Thread(new Runnable() {
                    @Override
                    public void run() {
                        boolean containsCsam = CsamAnalyzer.INSTANCE.containsCsam(bitmap);
                        MainActivity.this.runOnUiThread(new Runnable() {
                            @Override
                            public void run() {
                                if (containsCsam) {
                                    resultTextView.setText("CSAM detected");
                                } else {
                                    resultTextView.setText("CSAM not detected");
                                }
                                selectImageButton.setEnabled(true);
                                selectImageButton.setClickable(true);
                            }
                        });
                    }
                }).start();
            } catch (IOException e) {
                Log.e("MainActivity", "Error loading selected image: " + e.toString());
            }
        } else {
            super.onActivityResult(requestCode, resultCode, data);
        }
    }

    private void openFileBrowser(int requestCode) {
        final String[] ACCEPT_MIME_TYPES = {
                "image/*"
        };

        Intent intent = new Intent(Intent.ACTION_GET_CONTENT);
        intent.setType("*/*");

        startActivityForResult(intent, requestCode);
    }

    private boolean isPermissionGranted(String permission) {
        return ContextCompat.checkSelfPermission(this, permission) == PackageManager.PERMISSION_GRANTED;
    }
}