{ pkgs }: {
  # Which nixpkgs channel to use.
  channel = "stable-24.11"; # or "unstable"
  # Use https://search.nixos.org/packages to find packages
  packages = [
    pkgs.nodejs_20
    pkgs.zulu

    # --- START OF MODIFICATION FOR PYTHON BACKEND ---
    # Instead of just pkgs.python3Full, we create a Python environment
    # that includes Flask and other necessary packages.
    # Use pkgs.python3Full.withPackages or pkgs.python312.withPackages if you specifically need 3.12
    (pkgs.python3Full.withPackages (p: [
      p.flask # This will include the Flask library
      # Add other Python packages from your requirements.txt here:
      # e.g., p.requests, p.sqlalchemy
      p.gunicorn # Highly recommended for serving Flask in production
    ]))
    # --- END OF MODIFICATION ---
  ];
  # Sets environment variables in the workspace
  env = {};
  # This adds a file watcher to startup the firebase emulators. The emulators will only start if
  # a firebase.json file is written into the user's directory
  services.firebase.emulators = {
    detect = true;
    projectId = "demo-app";
    services = ["auth" "firestore"];
  };
  idx = {
    # Search for the extensions you want on https://open-vsx.org/ and use "publisher.id"
    extensions = [
      # "vscodevim.vim"
    ];
    workspace = {
      onCreate = {
        default.openFiles = [
          "src/app/page.tsx"
        ];
      };
    };
    # Enable previews and customize configuration
    previews = {
      enable = true;
      previews = {
        web = {
          command = ["npm" "run" "dev" "--" "--port" "$PORT" "--hostname" "0.0.0.0"];
          manager = "web";
        };
        # --- ADD PREVIEW FOR YOUR PYTHON BACKEND HERE ---
        # You'll need a separate preview for your Python backend
        # This assumes your app.py starts a web server (e.g., using gunicorn)
        python = {
          command = ["gunicorn" "--bind" "0.0.0.0:$PORT" "app:app"]; # Replace app:app with your actual entry point
          manager = "web"; # Assuming it's a web server
        };
        # --- END OF BACKEND PREVIEW ADDITION ---
      };
    };
  };
}